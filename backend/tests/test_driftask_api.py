"""Driftask CRM backend API tests - covers auth, contacts, deals, tasks, notes, dashboard."""
import os
import uuid
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
def demo_token(session):
    # Try login first; if it fails, register the demo user
    r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    if r.status_code != 200:
        r2 = session.post(
            f"{API}/auth/register",
            json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD, "full_name": "Demo User"},
        )
        assert r2.status_code in (200, 201), f"Register fallback failed: {r2.status_code} {r2.text}"
        return r2.json()["access_token"]
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(demo_token):
    return {"Authorization": f"Bearer {demo_token}", "Content-Type": "application/json"}


# ---------------- AUTH ----------------
class TestAuth:
    def test_register_new_user(self, session):
        email = f"test_{uuid.uuid4().hex[:8]}@driftask.app"
        r = session.post(f"{API}/auth/register", json={"email": email, "password": "secret123", "full_name": "Test User"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data
        assert data["user"]["email"] == email.lower()
        assert data["user"]["full_name"] == "Test User"

    def test_register_duplicate_returns_409(self, session):
        r = session.post(
            f"{API}/auth/register",
            json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD, "full_name": "Demo User"},
        )
        assert r.status_code == 409, r.text

    def test_login_success(self, session):
        r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
        assert r.status_code == 200, r.text
        assert "access_token" in r.json()

    def test_login_wrong_password_401(self, session):
        r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": "wrongpass"})
        assert r.status_code == 401

    def test_me_with_valid_token(self, session, auth_headers):
        r = session.get(f"{API}/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["email"] == DEMO_EMAIL

    def test_me_without_token_returns_403(self, session):
        # FastAPI HTTPBearer returns 403 when no Authorization header
        r = requests.get(f"{API}/auth/me")
        assert r.status_code in (401, 403)

    def test_me_invalid_token_401(self, session):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
        assert r.status_code == 401


# ---------------- CONTACTS ----------------
class TestContacts:
    created_id = None

    def test_create_contact(self, session, auth_headers):
        payload = {"name": "TEST_Alice", "email": "alice@test.com", "phone": "1234567890", "company": "TestCo", "position": "CEO"}
        r = session.post(f"{API}/contacts", headers=auth_headers, json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "TEST_Alice"
        assert data["email"] == "alice@test.com"
        TestContacts.created_id = data["id"]

    def test_list_contacts_includes_created(self, session, auth_headers):
        r = session.get(f"{API}/contacts", headers=auth_headers)
        assert r.status_code == 200
        ids = [c["id"] for c in r.json()]
        assert TestContacts.created_id in ids

    def test_get_contact_by_id(self, session, auth_headers):
        r = session.get(f"{API}/contacts/{TestContacts.created_id}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["id"] == TestContacts.created_id

    def test_contacts_requires_auth(self, session):
        r = requests.get(f"{API}/contacts")
        assert r.status_code in (401, 403)

    def test_delete_contact(self, session, auth_headers):
        r = session.delete(f"{API}/contacts/{TestContacts.created_id}", headers=auth_headers)
        assert r.status_code == 200
        # Verify gone
        r2 = session.get(f"{API}/contacts/{TestContacts.created_id}", headers=auth_headers)
        assert r2.status_code == 404


# ---------------- DEALS ----------------
class TestDeals:
    created_id = None

    def test_create_deal(self, session, auth_headers):
        r = session.post(f"{API}/deals", headers=auth_headers, json={"title": "TEST_Deal", "value": 5000, "stage": "lead"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["title"] == "TEST_Deal"
        assert d["stage"] == "lead"
        TestDeals.created_id = d["id"]

    def test_list_deals(self, session, auth_headers):
        r = session.get(f"{API}/deals", headers=auth_headers)
        assert r.status_code == 200
        assert any(d["id"] == TestDeals.created_id for d in r.json())

    def test_update_deal_stage(self, session, auth_headers):
        r = session.patch(f"{API}/deals/{TestDeals.created_id}", headers=auth_headers, json={"stage": "won"})
        assert r.status_code == 200
        assert r.json()["stage"] == "won"

    def test_delete_deal(self, session, auth_headers):
        r = session.delete(f"{API}/deals/{TestDeals.created_id}", headers=auth_headers)
        assert r.status_code == 200


# ---------------- TASKS ----------------
class TestTasks:
    created_id = None

    def test_create_task(self, session, auth_headers):
        r = session.post(f"{API}/tasks", headers=auth_headers, json={"title": "TEST_Task", "priority": "high"})
        assert r.status_code == 200, r.text
        t = r.json()
        assert t["title"] == "TEST_Task"
        assert t["completed"] is False
        TestTasks.created_id = t["id"]

    def test_list_tasks(self, session, auth_headers):
        r = session.get(f"{API}/tasks", headers=auth_headers)
        assert r.status_code == 200

    def test_toggle_task_completed(self, session, auth_headers):
        r = session.patch(f"{API}/tasks/{TestTasks.created_id}", headers=auth_headers, json={"completed": True})
        assert r.status_code == 200
        assert r.json()["completed"] is True

    def test_delete_task(self, session, auth_headers):
        r = session.delete(f"{API}/tasks/{TestTasks.created_id}", headers=auth_headers)
        assert r.status_code == 200


# ---------------- NOTES ----------------
class TestNotes:
    def test_create_and_filter_note(self, session, auth_headers):
        # Create a contact to attach note to
        rc = session.post(f"{API}/contacts", headers=auth_headers, json={"name": "TEST_NoteContact"})
        contact_id = rc.json()["id"]

        rn = session.post(f"{API}/notes", headers=auth_headers, json={"content": "TEST_note_content", "contact_id": contact_id})
        assert rn.status_code == 200, rn.text

        # filter by contact_id
        rl = session.get(f"{API}/notes", headers=auth_headers, params={"contact_id": contact_id})
        assert rl.status_code == 200
        notes = rl.json()
        assert len(notes) >= 1
        assert all(n["contact_id"] == contact_id for n in notes)

        # cleanup
        session.delete(f"{API}/contacts/{contact_id}", headers=auth_headers)


# ---------------- DASHBOARD ----------------
class TestDashboard:
    def test_dashboard_stats_shape(self, session, auth_headers):
        r = session.get(f"{API}/dashboard/stats", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        for key in [
            "total_contacts", "total_deals", "won_deals", "open_tasks",
            "revenue", "pipeline_value", "conversion_rate", "deals_by_stage",
        ]:
            assert key in data, f"missing key {key}"
        assert isinstance(data["deals_by_stage"], dict)


# ---------------- ISOLATION ----------------
class TestIsolation:
    def test_users_cannot_see_others_contacts(self, session):
        # User A
        emA = f"TEST_A_{uuid.uuid4().hex[:6]}@driftask.app"
        rA = session.post(f"{API}/auth/register", json={"email": emA, "password": "pass1234", "full_name": "User A"})
        tokenA = rA.json()["access_token"]
        hA = {"Authorization": f"Bearer {tokenA}", "Content-Type": "application/json"}
        rc = session.post(f"{API}/contacts", headers=hA, json={"name": "TEST_PrivateA"})
        cid = rc.json()["id"]

        # User B
        emB = f"TEST_B_{uuid.uuid4().hex[:6]}@driftask.app"
        rB = session.post(f"{API}/auth/register", json={"email": emB, "password": "pass1234", "full_name": "User B"})
        tokenB = rB.json()["access_token"]
        hB = {"Authorization": f"Bearer {tokenB}", "Content-Type": "application/json"}

        # B should not see A's contact
        rget = session.get(f"{API}/contacts/{cid}", headers=hB)
        assert rget.status_code == 404
        rlist = session.get(f"{API}/contacts", headers=hB)
        assert all(c["id"] != cid for c in rlist.json())
