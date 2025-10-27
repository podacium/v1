# prisma/seed.py
# Async seed for prisma-client-py
# Run with: python prisma/seed.py
# (after prisma generate and migrations)

import asyncio
from prisma import Prisma
from datetime import datetime, timedelta

db = Prisma()

async def main():
    await db.connect()

    # Clear some tables (safe for dev only)
    try:
        await db.dashboard.delete_many()
        await db.dataset.delete_many()
        await db.user.delete_many()
        await db.organization.delete_many()
    except Exception:
        pass

    # Create an organization
    org = await db.organization.create(
        {
            "name": "Podacium Lab",
            "slug": "podacium-lab",
            "description": "Podacium internal org",
            "country": "DZ"
        }
    )

    # Create users
    alice = await db.user.create(
        {
            "fullName": "Alice Admin",
            "email": "alice@podacium.test",
            "passwordHash": "dev-placeholder",  # replace with real hashed password
            "role": "ADMIN",
            "primaryOrganizationId": org.id,
            "bio": "Admin user"
        }
    )

    bob = await db.user.create(
        {
            "fullName": "Bob Student",
            "email": "bob@podacium.test",
            "passwordHash": "dev-placeholder",
            "role": "STUDENT",
            "primaryOrganizationId": org.id,
            "bio": "Student test user"
        }
    )

    # Create a module, lessons, path, enrollments
    path = await db.path.create({"title": "Data Foundation", "slug": "data-foundation", "description": "Foundation path"})
    module = await db.module.create({
        "title": "Intro to Data",
        "slug": "intro-to-data",
        "description": "An introductory module",
        "pathLinks": {"create": [{"pathId": path.id, "order": 1}]}
    })

    lesson1 = await db.lesson.create({"moduleId": module.id, "title": "Lesson 1: Data Types", "type": "video", "videoUrl": "https://example.com/vid1"})
    lesson2 = await db.lesson.create({"moduleId": module.id, "title": "Lesson 2: CSVs", "type": "video", "videoUrl": "https://example.com/vid2"})

    # Enrollment
    await db.enrollment.create({
        "userId": bob.id,
        "moduleId": module.id,
        "pathId": path.id
    })

    # Dataset + dashboard + widget + insight
    ds = await db.dataset.create({
        "name": "Sales Sample",
        "slug": "sales-sample",
        "description": "Sample CSV for sales",
        "userId": alice.id,
        "metadata": {"rows": 100, "columns": ["date","revenue","region"]},
        "processingStatus": "COMPLETED"
    })

    dash = await db.dashboard.create({
        "title": "Sales Overview",
        "slug": "sales-overview",
        "description": "Auto dashboard",
        "ownerId": alice.id
    })

    # Link dataset to dashboard
    await db.dashboarddataset.create({
        "dashboardId": dash.id,
        "datasetId": ds.id
    })

    await db.widget.create({
        "dashboardId": dash.id,
        "datasetId": ds.id,
        "type": "CHART",
        "config": {"type": "line", "x": "date", "y": "revenue"}
    })

    await db.insight.create({
        "dashboardId": dash.id,
        "userId": alice.id,
        "content": "Revenue grew 12% month-over-month."
    })

    print("Seed complete.")
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
