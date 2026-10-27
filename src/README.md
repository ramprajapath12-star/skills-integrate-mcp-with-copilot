# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Teacher sign-in required to register or unregister students

## Teacher Access

Configure the teacher account through the `TEACHER_USERNAME` and
`TEACHER_PASSWORD` environment variables before starting the application. For
example, set them in your deployment's secret/environment settings, then start
the server as usual. Do not commit credentials or put them in a checked-in
configuration file.

If either variable is missing, teacher sign-in and activity changes are
disabled. The activities and participant lists remain visible to students.
Teacher credentials are held only in the browser's memory until sign-out or
page reload. Deploy behind HTTPS so credentials are encrypted in transit.

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Set the teacher credentials and run the application from the `src` directory:

   ```
   export TEACHER_USERNAME=teacher
   export TEACHER_PASSWORD='<use a strong secret>'
   uvicorn app:app --reload
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| GET    | `/auth/verify`                                                     | Verify teacher credentials                                          |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Teacher-only student signup                                         |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Teacher-only student removal                                       |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.
