"""Driftask CRM iteration 2 backend tests: Google Drive endpoints + Notes filtering + Tasks due_date."""
import os
import uuid
from datetime import datetime, timezone, timedelta
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://driftask-connect.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@driftask.app"
DEMO_PASSWORD = "demo123"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def fresh_user_token(session):
    """Create a brand-new user so Drive token doesn't exist (state isolation)."""
    email = f"test_drive_{uuid.uuid4().hex[:8]}@driftask.app"
    r = session.post(
        f"{API}/auth/register",
        json={"email": email, "password": "secret123", "full_name": "Drive Test User"},
    )
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def fresh_headers(fresh_user_token):
    return {"Authorization": f"Bearer {fresh_user_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def demo_headers(session):
    r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    if r.status_code != 200:
        session.post(f"{API}/auth/register", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD, "full_name": "Demo User"})
        r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------------- GOOGLE DRIVE ----------------
class TestDrive:
    def test_drive_status_not_connected(self, session, fresh_headers):
        r = session.get(f"{API}/drive/status", headers=fresh_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["connected"] is False
        assert data.get("email") in (None, "")

    def test_drive_auth_exchange_with_bad_code_returns_400(self, session, fresh_headers):
        r = session.post(
            f"{API}/drive/auth/exchange",
            json={"code": "obviously_invalid_code", "redirect_uri": "https://example.com/cb"},
            headers=fresh_headers,
        )
        # Should not crash (no 500); should be 400 with informative detail
        assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"
        assert "detail" in r.json()

    def test_drive_backup_when_not_connected_returns_400(self, session, fresh_headers):
        r = session.post(f"{API}/drive/backup", headers=fresh_headers)
        assert r.status_code == 400, r.text
        assert "not connected" in r.json()["detail"].lower()

    def test_drive_list_backups_when_not_connected_returns_400(self, session, fresh_headers):
        r = session.get(f"{API}/drive/backups", headers=fresh_headers)
        assert r.status_code == 400, r.text
        assert "not connected" in r.json()["detail"].lower()

    def test_drive_disconnect_idempotent(self, session, fresh_headers):
        r = session.post(f"{API}/drive/disconnect", headers=fresh_headers)
        assert r.status_code == 200, r.text
        assert r.json()["connected"] is False
        # Calling again should still be 200 (no record to delete)
        r2 = session.post(f"{API}/drive/disconnect", headers=fresh_headers)
        assert r2.status_code == 200
        assert r2.json()["connected"] is False

    def test_drive_endpoints_require_auth(self, session):
        for path, method in [
            ("/drive/status", "get"),
            ("/drive/backup", "post"),
            ("/drive/backups", "get"),
            ("/drive/disconnect", "post"),
        ]:
            r = getattr(session, method)(f"{API}{path}")
            assert r.status_code in (401, 403), f"{path} did not require auth: {r.status_code}"


# ---------------- NOTES filter by contact_id / deal_id ----------------
class TestNotesFiltering:
    @pytest.fixture(scope="class")
    def created_ids(self, session, demo_headers):
        # Create two contacts and one deal, then notes attached to each
        c1 = session.post(f"{API}/contacts", json={"name": "TEST_NoteContactA"}, headers=demo_headers).json()
        c2 = session.post(f"{API}/contacts", json={"name": "TEST_NoteContactB"}, headers=demo_headers).json()
        d1 = session.post(f"{API}/deals", json={"title": "TEST_NoteDeal", "value": 100}, headers=demo_headers).json()
        n1 = session.post(f"{API}/notes", json={"content": "TEST_note_for_A_1", "contact_id": c1["id"]}, headers=demo_headers)
        n2 = session.post(f"{API}/notes", json={"content": "TEST_note_for_A_2", "contact_id": c1["id"]}, headers=demo_headers)
        n3 = session.post(f"{API}/notes", json={"content": "TEST_note_for_B", "contact_id": c2["id"]}, headers=demo_headers)
        n4 = session.post(f"{API}/notes", json={"content": "TEST_note_for_deal", "deal_id": d1["id"]}, headers=demo_headers)
        for n in (n1, n2, n3, n4):
            assert n.status_code == 200, n.text
        yield {"c1": c1["id"], "c2": c2["id"], "d1": d1["id"]}
        # Cleanup
        session.delete(f"{API}/contacts/{c1['id']}", headers=demo_headers)
        session.delete(f"{API}/contacts/{c2['id']}", headers=demo_headers)
        session.delete(f"{API}/deals/{d1['id']}", headers=demo_headers)

    def test_create_note_with_contact_id(self, session, demo_headers, created_ids):
        r = session.post(
            f"{API}/notes",
            json={"content": "TEST_persisted_note", "contact_id": created_ids["c1"]},
            headers=demo_headers,
        )
        assert r.status_code == 200, r.text
        n = r.json()
        assert n["contact_id"] == created_ids["c1"]
        assert n["content"] == "TEST_persisted_note"
        assert "id" in n and "created_at" in n

    def test_filter_notes_by_contact_id(self, session, demo_headers, created_ids):
        r = session.get(f"{API}/notes", params={"contact_id": created_ids["c1"]}, headers=demo_headers)
        assert r.status_code == 200, r.text
        notes = r.json()
        assert len(notes) >= 2
        assert all(n["contact_id"] == created_ids["c1"] for n in notes)
        # Make sure contact B's note is NOT in the list
        assert all(n.get("contact_id") != created_ids["c2"] for n in notes)

    def test_filter_notes_by_deal_id(self, session, demo_headers, created_ids):
        r = session.get(f"{API}/notes", params={"deal_id": created_ids["d1"]}, headers=demo_headers)
        assert r.status_code == 200, r.text
        notes = r.json()
        assert len(notes) >= 1
        assert all(n["deal_id"] == created_ids["d1"] for n in notes)


# ---------------- TASKS with due_date ----------------
class TestTasksDueDate:
    def test_create_task_with_due_date(self, session, demo_headers):
        due = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
        r = session.post(
            f"{API}/tasks",
            json={"title": "TEST_task_with_due", "due_date": due, "priority": "high"},
            headers=demo_headers,
        )
        assert r.status_code == 200, r.text
        t = r.json()
        assert t["title"] == "TEST_task_with_due"
        assert t["due_date"] is not None
        # GET to verify persistence
        gid = t["id"]
        all_tasks = session.get(f"{API}/tasks", headers=demo_headers).json()
        match = next((x for x in all_tasks if x["id"] == gid), None)
        assert match is not None
        assert match["due_date"] is not None
        # Cleanup
        session.delete(f"{API}/tasks/{gid}", headers=demo_headers)

    def test_create_task_without_due_date(self, session, demo_headers):
        r = session.post(f"{API}/tasks", json={"title": "TEST_task_no_due"}, headers=demo_headers)
        assert r.status_code == 200, r.text
        t = r.json()
        assert t["due_date"] is None
        session.delete(f"{API}/tasks/{t['id']}", headers=demo_headers)


# ---------------- REGRESSION: ensure existing endpoints still work ----------------
class TestRegression:
    def test_login_demo(self, session):
        r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
        assert r.status_code == 200

    def test_dashboard_stats(self, session, demo_headers):
        r = session.get(f"{API}/dashboard/stats", headers=demo_headers)
        assert r.status_code == 200, r.text
        for k in ("total_contacts", "total_deals", "won_deals", "open_tasks", "revenue", "pipeline_value", "conversion_rate", "deals_by_stage"):
            assert k in r.json()

    def test_contacts_crud(self, session, demo_headers):
        r = session.post(f"{API}/contacts", json={"name": "TEST_regression_contact"}, headers=demo_headers)
        assert r.status_code == 200
        cid = r.json()["id"]
        assert session.get(f"{API}/contacts/{cid}", headers=demo_headers).status_code == 200
        assert session.delete(f"{API}/contacts/{cid}", headers=demo_headers).status_code == 200

    def test_deals_crud(self, session, demo_headers):
        r = session.post(f"{API}/deals", json={"title": "TEST_regression_deal", "value": 50}, headers=demo_headers)
        assert r.status_code == 200
        did = r.json()["id"]
        assert session.patch(f"{API}/deals/{did}", json={"stage": "won"}, headers=demo_headers).status_code == 200
        assert session.delete(f"{API}/deals/{did}", headers=demo_headers).status_code == 200
