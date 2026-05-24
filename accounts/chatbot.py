"""Rule-based chatbot for the School Portal (PIT chatbot requirement)."""

FAQ_RESPONSES = [
    (
        ('hello', 'hi', 'hey', 'good morning', 'good afternoon'),
        "Hello! I'm the School Portal assistant. Ask about enrollment, students, subjects, sections, or your account.",
    ),
    (
        ('enroll', 'enrollment', 'register student'),
        "To enroll a student: go to Enrollments → select student and subject. The system assigns an available section automatically.",
    ),
    (
        ('student', 'add student'),
        "Students are managed under Students. Staff and admins can create, update, or delete student records.",
    ),
    (
        ('subject', 'course'),
        "Subjects define courses (code, title, units). Create subjects before adding sections or enrollments.",
    ),
    (
        ('section', 'schedule', 'capacity'),
        "Each subject can have multiple sections with capacity and schedule. Enrollments respect section capacity.",
    ),
    (
        ('login', 'password', 'account', 'activate', 'verification', 'email'),
        "Register with a valid email, then activate via the link sent to your inbox. Unverified accounts cannot log in in production.",
    ),
    (
        ('role', 'admin', 'staff', 'permission', 'rbac'),
        "Roles: Admin (full access), Staff (manage school data), User (view dashboard and manage profile).",
    ),
    (
        ('profile', 'picture', 'upload', 'photo'),
        "Open Profile to update your name, email, and profile picture. Images are stored securely on the server.",
    ),
    (
        ('summary', 'report', 'statistics', 'stats', 'dashboard'),
        "The Dashboard shows live counts; Enrollment Summary breaks down units per student and subject.",
    ),
    (
        ('help', 'support', 'what can you do'),
        "I can help with: enrollment steps, students, subjects, sections, login/activation, roles, and profile uploads.",
    ),
    (
        ('thank', 'thanks'),
        "You're welcome! Good luck with your enrollment tasks.",
    ),
    (
        ('bye', 'goodbye'),
        "Goodbye! Come back anytime you need help with the portal.",
    ),
]


def get_chatbot_reply(message: str, username: str | None = None) -> str:
    text = (message or '').strip().lower()
    if not text:
        return "Please type a message. Try: 'How do I enroll a student?'"

    for keywords, reply in FAQ_RESPONSES:
        if any(kw in text for kw in keywords):
            if username and ('hello' in keywords or 'hi' in keywords):
                return f"Hello {username}! " + reply.split('!', 1)[-1].strip() if '!' in reply else reply
            return reply

    return (
        "I'm not sure about that. Try asking about enrollment, students, subjects, sections, "
        "login, roles, or your profile. Example: 'How does enrollment work?'"
    )
