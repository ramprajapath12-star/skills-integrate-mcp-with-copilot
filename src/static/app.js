document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const teacherOnlyMessage = document.getElementById("teacher-only-message");
  const adminToggle = document.getElementById("admin-toggle");
  const loginDialog = document.getElementById("login-dialog");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  let authorizationHeader = null;
  let messageTimeout;

  function showMessage(text, className) {
    messageDiv.textContent = text;
    messageDiv.className = className;
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function renderTeacherControls() {
    const isTeacher = authorizationHeader !== null;
    adminToggle.textContent = isTeacher ? "Teacher sign out" : "Teacher sign in";
    signupForm.classList.toggle("hidden", !isTeacher);
    teacherOnlyMessage.classList.toggle("hidden", isTeacher);
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const activities = await response.json();
      activitiesList.replaceChildren();
      activitySelect.replaceChildren(new Option("-- Select an activity --", ""));

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const title = document.createElement("h4");
        title.textContent = name;
        activityCard.appendChild(title);

        const description = document.createElement("p");
        description.textContent = details.description;
        activityCard.appendChild(description);

        const schedule = document.createElement("p");
        const scheduleLabel = document.createElement("strong");
        scheduleLabel.textContent = "Schedule: ";
        schedule.append(scheduleLabel, document.createTextNode(details.schedule));
        activityCard.appendChild(schedule);

        const spotsLeft = details.max_participants - details.participants.length;
        const availability = document.createElement("p");
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability: ";
        availability.append(
          availabilityLabel,
          document.createTextNode(`${spotsLeft} spots left`)
        );
        activityCard.appendChild(availability);

        const participantsContainer = document.createElement("div");
        participantsContainer.className = "participants-container";
        if (details.participants.length > 0) {
          const participantsSection = document.createElement("div");
          participantsSection.className = "participants-section";
          const participantsHeading = document.createElement("h5");
          participantsHeading.textContent = "Participants:";
          const participantsList = document.createElement("ul");
          participantsList.className = "participants-list";

          details.participants.forEach((email) => {
            const participant = document.createElement("li");
            const participantEmail = document.createElement("span");
            participantEmail.className = "participant-email";
            participantEmail.textContent = email;
            participant.appendChild(participantEmail);

            if (authorizationHeader) {
              const removeButton = document.createElement("button");
              removeButton.className = "delete-btn";
              removeButton.type = "button";
              removeButton.textContent = "Remove";
              removeButton.setAttribute("aria-label", `Remove ${email} from ${name}`);
              removeButton.addEventListener("click", () =>
                handleUnregister(name, email)
              );
              participant.appendChild(removeButton);
            }

            participantsList.appendChild(participant);
          });

          participantsSection.append(participantsHeading, participantsList);
          participantsContainer.appendChild(participantsSection);
        } else {
          const emptyParticipants = document.createElement("p");
          const emptyMessage = document.createElement("em");
          emptyMessage.textContent = "No participants yet";
          emptyParticipants.appendChild(emptyMessage);
          participantsContainer.appendChild(emptyParticipants);
        }
        activityCard.appendChild(participantsContainer);
        activitiesList.appendChild(activityCard);

        activitySelect.add(new Option(name, name));
      });
    } catch (error) {
      activitiesList.textContent =
        "Failed to load activities. Please try again later.";
      console.error("Error fetching activities:", error);
    }
  }

  async function handleUnregister(activity, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: { Authorization: authorizationHeader },
        }
      );
      const result = await response.json();

      if (!response.ok) {
        showMessage(result.detail || "An error occurred", "error");
        return;
      }

      showMessage(result.message, "success");
      await fetchActivities();
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  adminToggle.addEventListener("click", () => {
    if (authorizationHeader) {
      authorizationHeader = null;
      renderTeacherControls();
      fetchActivities();
      showMessage("Signed out.", "info");
      return;
    }

    loginError.classList.add("hidden");
    loginDialog.showModal();
  });

  document.getElementById("cancel-login").addEventListener("click", () => {
    loginDialog.close();
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginError.classList.add("hidden");

    const formData = new FormData(loginForm);
    const credentials = `${formData.get("username")}:${formData.get("password")}`;
    const bytes = new TextEncoder().encode(credentials);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    const candidateHeader = `Basic ${btoa(binary)}`;

    try {
      const response = await fetch("/auth/verify", {
        headers: { Authorization: candidateHeader },
      });
      const result = await response.json();
      if (!response.ok) {
        loginError.textContent = result.detail || "Unable to sign in.";
        loginError.classList.remove("hidden");
        return;
      }

      authorizationHeader = candidateHeader;
      loginForm.reset();
      loginDialog.close();
      renderTeacherControls();
      showMessage("Teacher signed in.", "success");
      await fetchActivities();
    } catch (error) {
      loginError.textContent = "Unable to sign in. Please try again.";
      loginError.classList.remove("hidden");
      console.error("Error signing in:", error);
    }
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = activitySelect.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: { Authorization: authorizationHeader },
        }
      );
      const result = await response.json();

      if (!response.ok) {
        showMessage(result.detail || "An error occurred", "error");
        return;
      }

      showMessage(result.message, "success");
      signupForm.reset();
      await fetchActivities();
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  renderTeacherControls();
  fetchActivities();
});
