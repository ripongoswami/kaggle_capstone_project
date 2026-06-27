import json
import re

# Mock Roadmap Data for Python Web Developer
MOCK_ROADMAP = {
    "title": "Professional Python Web Developer Career Path",
    "milestones": [
        {
            "title": "Milestone 1: Python Basics & Environment",
            "lessons": [
                {
                    "title": "Introduction to Python & Setup",
                    "description": "Install Python, set up VS Code, and learn about the Python interpreter and REPL.",
                    "estimated_time": 30
                },
                {
                    "title": "Variables, Operators & Types",
                    "description": "Explore variables, integers, floats, strings, booleans, and basic operators.",
                    "estimated_time": 45
                },
                {
                    "title": "Control Flow & Loops",
                    "description": "Master if-else logic, for loops, and while loops for execution control.",
                    "estimated_time": 45
                }
            ]
        },
        {
            "title": "Milestone 2: Data Structures & Object-Oriented Python",
            "lessons": [
                {
                    "title": "Lists, Tuples & Dictionaries",
                    "description": "Understand key Python collections, slicing, and common built-in operations.",
                    "estimated_time": 45
                },
                {
                    "title": "Functions & Scope",
                    "description": "Write reusable functions, explore parameters, return values, and scope rules.",
                    "estimated_time": 45
                },
                {
                    "title": "Object-Oriented Programming (OOP)",
                    "description": "Master classes, objects, inheritance, methods, and encapsulation.",
                    "estimated_time": 60
                }
            ]
        },
        {
            "title": "Milestone 3: Database Design & Integration",
            "lessons": [
                {
                    "title": "Relational Databases & SQL",
                    "description": "Learn SQL basics: tables, SELECT, INSERT, UPDATE, DELETE, and table joins.",
                    "estimated_time": 45
                },
                {
                    "title": "SQLAlchemy ORM",
                    "description": "Connect Python classes to database tables and execute queries cleanly using an ORM.",
                    "estimated_time": 60
                }
            ]
        },
        {
            "title": "Milestone 4: Building APIs with FastAPI",
            "lessons": [
                {
                    "title": "Introduction to FastAPI & Routing",
                    "description": "Build a web server, declare HTTP routes, and handle query and path parameters.",
                    "estimated_time": 45
                },
                {
                    "title": "Request Validation with Pydantic",
                    "description": "Define request and response schemas, validate data, and serialize models.",
                    "estimated_time": 45
                },
                {
                    "title": "Token Authentication & Security",
                    "description": "Secure endpoints using JSON Web Tokens (JWT), password hashing (bcrypt), and dependencies.",
                    "estimated_time": 60
                }
            ]
        },
        {
            "title": "Milestone 5: Containers & Deployment",
            "lessons": [
                {
                    "title": "Containerization with Docker",
                    "description": "Write Dockerfiles, build container images, and run multi-container setups locally.",
                    "estimated_time": 45
                },
                {
                    "title": "Deploying FastAPI Applications",
                    "description": "Deploy your database-backed API live to cloud providers like Render, Railway, or AWS.",
                    "estimated_time": 60
                }
            ]
        }
    ]
}

# Mock Career Paths suggestion
MOCK_CAREER_PATHS = [
    {
        "title": "Junior Backend Engineer (Python)",
        "skills": ["Python", "FastAPI", "SQLAlchemy", "SQLite/PostgreSQL", "Git"],
        "certifications": ["PCEP - Certified Entry-Level Python Programmer", "Meta Back-End Developer Certificate"]
    },
    {
        "title": "Python Web Developer",
        "skills": ["Python", "FastAPI", "Django", "Pydantic", "Docker", "RESTful APIs"],
        "certifications": ["PCAP - Certified Associate in Python Programming", "Google IT Automation with Python"]
    },
    {
        "title": "Full Stack Software Engineer",
        "skills": ["Python", "FastAPI", "React", "TypeScript", "Tailwind CSS", "Docker", "CI/CD"],
        "certifications": ["AWS Certified Developer - Associate"]
    }
]

# Mock Resources mapped by intent/query
MOCK_RESOURCES = {
    "docs": [
        {
            "title": "Official Python Documentation",
            "type": "Docs",
            "url": "https://docs.python.org/3/",
            "description": "The official language reference and library documentation for Python 3.",
            "relevance_score": 0.98,
            "source_domain": "python.org",
            "level": "All Levels"
        },
        {
            "title": "FastAPI official documentation",
            "type": "Docs",
            "url": "https://fastapi.tiangolo.com/",
            "description": "Official interactive documentation guide for building APIs with FastAPI.",
            "relevance_score": 0.96,
            "source_domain": "fastapi.tiangolo.com",
            "level": "All Levels"
        },
        {
            "title": "SQLAlchemy ORM Quick Start",
            "type": "Docs",
            "url": "https://docs.sqlalchemy.org/en/20/orm/quickstart.html",
            "description": "Official guide on mapping tables and running database operations using SQLAlchemy 2.0.",
            "relevance_score": 0.94,
            "source_domain": "sqlalchemy.org",
            "level": "Intermediate"
        },
        {
            "title": "Docker Reference Documentation",
            "type": "Docs",
            "url": "https://docs.docker.com/reference/",
            "description": "Official guides for Dockerfile commands, builder parameters, and docker-compose configurations.",
            "relevance_score": 0.92,
            "source_domain": "docker.com",
            "level": "Intermediate"
        },
        {"title": "Django Documentation", "type": "Docs", "url": "https://docs.djangoproject.com/en/stable/", "description": "Official Django web framework reference for models, views, and templates.", "relevance_score": 0.91, "source_domain": "djangoproject.com", "level": "All Levels"},
        {"title": "Flask Documentation", "type": "Docs", "url": "https://flask.palletsprojects.com/", "description": "Official Flask microframework documentation for routing and extensions.", "relevance_score": 0.90, "source_domain": "flask.palletsprojects.com", "level": "All Levels"},
        {"title": "MDN Web Docs — Python", "type": "Docs", "url": "https://developer.mozilla.org/en-US/docs/Web/Python", "description": "MDN reference for Python basics used in web development contexts.", "relevance_score": 0.89, "source_domain": "developer.mozilla.org", "level": "Beginner"},
        {"title": "Pydantic Documentation", "type": "Docs", "url": "https://docs.pydantic.dev/latest/", "description": "Data validation and settings management using Python type hints.", "relevance_score": 0.88, "source_domain": "pydantic.dev", "level": "Intermediate"},
        {"title": "Uvicorn Deployment Guide", "type": "Docs", "url": "https://www.uvicorn.org/deployment/", "description": "ASGI server deployment options for FastAPI and Starlette apps.", "relevance_score": 0.87, "source_domain": "uvicorn.org", "level": "Intermediate"},
        {"title": "PostgreSQL Python Driver (psycopg)", "type": "Docs", "url": "https://www.psycopg.org/psycopg3/docs/", "description": "Official docs for connecting Python web apps to PostgreSQL.", "relevance_score": 0.86, "source_domain": "psycopg.org", "level": "Intermediate"},
        {"title": "React Documentation", "type": "Docs", "url": "https://react.dev/learn", "description": "Official React docs for building frontend UIs paired with Python APIs.", "relevance_score": 0.85, "source_domain": "react.dev", "level": "Beginner"},
        {"title": "Git Documentation", "type": "Docs", "url": "https://git-scm.com/doc", "description": "Version control reference essential for web developer workflows.", "relevance_score": 0.84, "source_domain": "git-scm.com", "level": "All Levels"},
        {"title": "HTTP Status Codes — MDN", "type": "Docs", "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status", "description": "HTTP response codes reference for REST API development.", "relevance_score": 0.83, "source_domain": "developer.mozilla.org", "level": "All Levels"},
        {"title": "OpenAPI Specification", "type": "Docs", "url": "https://swagger.io/specification/", "description": "Standard for describing REST APIs, used by FastAPI automatically.", "relevance_score": 0.82, "source_domain": "swagger.io", "level": "Intermediate"},
        {"title": "Jinja2 Template Documentation", "type": "Docs", "url": "https://jinja.palletsprojects.com/en/latest/", "description": "Template engine docs for server-rendered Python web apps.", "relevance_score": 0.81, "source_domain": "jinja.palletsprojects.com", "level": "Intermediate"},
    ],
    "courses": [
        {
            "title": "Python for Everybody Specialization",
            "type": "Course",
            "url": "https://www.coursera.org/specializations/python",
            "description": "An extremely popular Coursera specialization teaching core Python concepts, databases, and web scraping.",
            "relevance_score": 0.95,
            "source_domain": "coursera.org",
            "level": "Beginner"
        },
        {
            "title": "FastAPI Complete Web Developer Course",
            "type": "Course",
            "url": "https://www.udemy.com/course/fastapi-course/",
            "description": "Udemy hands-on course covering routers, background tasks, authentication, databases, and Docker deployment.",
            "relevance_score": 0.92,
            "source_domain": "udemy.com",
            "level": "Intermediate"
        },
        {
            "title": "Learn Python Programming - freeCodeCamp Full 4-Hour Course",
            "type": "Course",
            "url": "https://www.youtube.com/watch?v=rfscVS0vtbw",
            "description": "Comprehensive video course covering basic syntax, file I/O, OOP, and mini projects.",
            "relevance_score": 0.91,
            "source_domain": "youtube.com",
            "level": "Beginner"
        },
        {"title": "Full Stack Web Development with Python", "type": "Course", "url": "https://www.udemy.com/course/python-and-django-full-stack-web-developer-bootcamp/", "description": "Bootcamp covering Django, HTML, CSS, JavaScript, and deployment.", "relevance_score": 0.90, "source_domain": "udemy.com", "level": "Beginner"},
        {"title": "Backend Development with Python and FastAPI", "type": "Course", "url": "https://www.udacity.com/course/full-stack-javascript-developer-nanodegree--nd089", "description": "Nanodegree-style path for API design, databases, and authentication.", "relevance_score": 0.89, "source_domain": "udacity.com", "level": "Intermediate"},
        {"title": "Harvard CS50's Web Programming with Python and JavaScript", "type": "Course", "url": "https://cs50.harvard.edu/web/", "description": "University course on Django, SQL, and frontend integration.", "relevance_score": 0.88, "source_domain": "harvard.edu", "level": "Intermediate"},
        {"title": "Real Python Learning Paths", "type": "Course", "url": "https://realpython.com/learning-paths/", "description": "Structured paths for web dev, APIs, and testing with Python.", "relevance_score": 0.87, "source_domain": "realpython.com", "level": "All Levels"},
        {"title": "freeCodeCamp Backend Development and APIs", "type": "Course", "url": "https://www.freecodecamp.org/learn/back-end-development-and-apis/", "description": "Free certification covering Node concepts applicable to Python APIs.", "relevance_score": 0.86, "source_domain": "freecodecamp.org", "level": "Beginner"},
        {"title": "Test-Driven Development with Python", "type": "Course", "url": "https://www.obeythetestinggoat.com/", "description": "Book/course on TDD for web apps using Django.", "relevance_score": 0.85, "source_domain": "obeythetestinggoat.com", "level": "Intermediate"},
        {"title": "Python Web Scraping — ScraperAPI Academy", "type": "Course", "url": "https://www.scraperapi.com/blog/web-scraping-python/", "description": "Tutorial series on scraping data for web applications.", "relevance_score": 0.84, "source_domain": "scraperapi.com", "level": "Intermediate"},
        {"title": "Deploy Python Apps on Railway", "type": "Course", "url": "https://docs.railway.app/guides/python", "description": "Step-by-step deployment guide for FastAPI/Django on Railway.", "relevance_score": 0.83, "source_domain": "railway.app", "level": "Beginner"},
        {"title": "LinkedIn Learning — Python Essential Training", "type": "Course", "url": "https://www.linkedin.com/learning/topics/python", "description": "Professional video courses on Python fundamentals and web modules.", "relevance_score": 0.82, "source_domain": "linkedin.com", "level": "Beginner"},
        {"title": "Codecademy Learn Python 3", "type": "Course", "url": "https://www.codecademy.com/learn/learn-python-3", "description": "Interactive Python course as foundation for web development.", "relevance_score": 0.81, "source_domain": "codecademy.com", "level": "Beginner"},
        {"title": "EdX Python for Data Science and AI", "type": "Course", "url": "https://www.edx.org/learn/python", "description": "IBM-backed Python course useful before web specialization.", "relevance_score": 0.80, "source_domain": "edx.org", "level": "Beginner"},
    ],
    "books": [
        {
            "title": "Fluent Python: Clear, Concise, and Effective Programming",
            "type": "Book",
            "url": "https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/",
            "description": "The ultimate book for intermediate developers to write clean, idiomatic, and efficient Python code.",
            "relevance_score": 0.96,
            "source_domain": "oreilly.com",
            "level": "Intermediate"
        },
        {
            "title": "Building APIs with FastAPI",
            "type": "Book",
            "url": "https://www.packtpub.com/product/building-apis-with-fastapi/9781803233819",
            "description": "A structured cookbook-style guide to building secure, performant microservices using FastAPI.",
            "relevance_score": 0.93,
            "source_domain": "packtpub.com",
            "level": "All Levels"
        },
        {
            "title": "Two Scoops of Django: Best Practices for Django 3.x",
            "type": "Book",
            "url": "https://www.feldroy.com/books/two-scoops-of-django-3-x",
            "description": "Standard code guide for structuring web applications, managing database setups, and securing deployments.",
            "relevance_score": 0.88,
            "source_domain": "feldroy.com",
            "level": "Advanced"
        },
        {"title": "Automate the Boring Stuff with Python", "type": "Book", "url": "https://automatetheboringstuff.com/", "description": "Practical Python for scripting and automation before web dev.", "relevance_score": 0.87, "source_domain": "automatetheboringstuff.com", "level": "Beginner"},
        {"title": "Python Crash Course, 3rd Edition", "type": "Book", "url": "https://nostarch.com/python-crash-course-3rd-edition", "description": "Project-based intro including web apps with Django.", "relevance_score": 0.86, "source_domain": "nostarch.com", "level": "Beginner"},
        {"title": "Architecture Patterns with Python", "type": "Book", "url": "https://www.cosmicpython.com/", "description": "Domain-driven design and patterns for Python web services.", "relevance_score": 0.85, "source_domain": "cosmicpython.com", "level": "Advanced"},
        {"title": "RESTful Web APIs", "type": "Book", "url": "https://www.oreilly.com/library/view/restful-web-apis/9781449359730/", "description": "Design principles for HTTP APIs relevant to FastAPI/Django REST.", "relevance_score": 0.84, "source_domain": "oreilly.com", "level": "Intermediate"},
        {"title": "Effective Python, 2nd Edition", "type": "Book", "url": "https://effectivepython.com/", "description": "90 specific ways to write better Python for production web code.", "relevance_score": 0.83, "source_domain": "effectivepython.com", "level": "Intermediate"},
        {"title": "High Performance Python, 2nd Edition", "type": "Book", "url": "https://www.oreilly.com/library/view/high-performance-python/9781492055020/", "description": "Profiling and optimization for Python web backends.", "relevance_score": 0.82, "source_domain": "oreilly.com", "level": "Advanced"},
        {"title": "Web Development with Django Cookbook", "type": "Book", "url": "https://www.packtpub.com/product/web-development-with-django-cookbook-second-edition/9781789952738", "description": "Recipes for authentication, APIs, and deployment with Django.", "relevance_score": 0.81, "source_domain": "packtpub.com", "level": "Intermediate"},
        {"title": "Cracking the Coding Interview — Python", "type": "Book", "url": "https://www.crackingthecodinginterview.com/", "description": "Interview prep for Python web developer roles.", "relevance_score": 0.80, "source_domain": "crackingthecodinginterview.com", "level": "All Levels"},
        {"title": "Designing Data-Intensive Applications", "type": "Book", "url": "https://dataintensive.net/", "description": "Foundational systems design for backend Python developers.", "relevance_score": 0.79, "source_domain": "dataintensive.net", "level": "Advanced"},
        {"title": "Python Tricks: The Book", "type": "Book", "url": "https://realpython.com/products/python-tricks-book/", "description": "Intermediate Python patterns used daily in web projects.", "relevance_score": 0.78, "source_domain": "realpython.com", "level": "Intermediate"},
        {"title": "Microservices Patterns", "type": "Book", "url": "https://microservices.io/book", "description": "Patterns for building scalable Python microservice architectures.", "relevance_score": 0.77, "source_domain": "microservices.io", "level": "Advanced"},
    ],
    "resources": [
        {
            "title": "How to Build a REST API with FastAPI - Tutorial",
            "type": "Article",
            "url": "https://realpython.com/fastapi-python-web-apis/",
            "description": "Real Python step-by-step tutorial on building REST APIs with routers, dependencies, and automatic docs.",
            "relevance_score": 0.97,
            "source_domain": "realpython.com",
            "level": "Beginner"
        },
        {
            "title": "Dockerizing a FastAPI Web Application",
            "type": "Article",
            "url": "https://testdriven.io/blog/fastapi-docker/",
            "description": "In-depth guide showing how to set up Docker, configure hot-reloading for development, and deploy.",
            "relevance_score": 0.94,
            "source_domain": "testdriven.io",
            "level": "Intermediate"
        },
        {
            "title": "Understanding Python's GIL (Global Interpreter Lock)",
            "type": "Video",
            "url": "https://www.youtube.com/watch?v=Obt-vRlTylQ",
            "description": "Excellent talk explaining the GIL, multi-threading vs multi-processing, and asynchronous code in Python.",
            "relevance_score": 0.91,
            "source_domain": "youtube.com",
            "level": "Advanced"
        },
        {"title": "Python Web Developer Roadmap 2024", "type": "Article", "url": "https://roadmap.sh/python", "description": "Visual skill tree for becoming a Python developer including web frameworks.", "relevance_score": 0.90, "source_domain": "roadmap.sh", "level": "Beginner"},
        {"title": "Full Stack Python — Open Book", "type": "Article", "url": "https://www.fullstackpython.com/", "description": "Comprehensive guide to Python web development concepts and tools.", "relevance_score": 0.89, "source_domain": "fullstackpython.com", "level": "Beginner"},
        {"title": "FastAPI Best Practices", "type": "Article", "url": "https://github.com/zhanymkanov/fastapi-best-practices", "description": "Community guide for structuring production FastAPI projects.", "relevance_score": 0.88, "source_domain": "github.com", "level": "Intermediate"},
        {"title": "Django REST Framework Tutorial", "type": "Article", "url": "https://www.django-rest-framework.org/tutorial/quickstart/", "description": "Official quickstart for building REST APIs with Django.", "relevance_score": 0.87, "source_domain": "django-rest-framework.org", "level": "Intermediate"},
        {"title": "Python Async/Await Explained", "type": "Video", "url": "https://www.youtube.com/watch?v=t5Bo1JeDj64", "description": "Core concepts for async Python used in FastAPI and Starlette.", "relevance_score": 0.86, "source_domain": "youtube.com", "level": "Intermediate"},
        {"title": "Setting Up PostgreSQL with SQLAlchemy", "type": "Article", "url": "https://www.sqlalchemy.org/", "description": "Database integration patterns for Python web backends.", "relevance_score": 0.85, "source_domain": "sqlalchemy.org", "level": "Intermediate"},
        {"title": "JWT Authentication in FastAPI", "type": "Article", "url": "https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/", "description": "Official tutorial on securing API endpoints with JWT tokens.", "relevance_score": 0.84, "source_domain": "fastapi.tiangolo.com", "level": "Intermediate"},
        {"title": "Deploy FastAPI on Render", "type": "Article", "url": "https://render.com/docs/deploy-fastapi", "description": "Cloud deployment walkthrough for Python web APIs.", "relevance_score": 0.83, "source_domain": "render.com", "level": "Beginner"},
        {"title": "Pytest for Web Application Testing", "type": "Article", "url": "https://docs.pytest.org/en/stable/", "description": "Testing framework docs for unit and integration tests in Python web apps.", "relevance_score": 0.82, "source_domain": "pytest.org", "level": "Intermediate"},
        {"title": "CORS Explained for REST APIs", "type": "Article", "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS", "description": "Cross-origin resource sharing guide for Python API backends.", "relevance_score": 0.81, "source_domain": "developer.mozilla.org", "level": "Beginner"},
        {"title": "Python Type Hints Cheat Sheet", "type": "Article", "url": "https://mypy.readthedocs.io/en/stable/cheat_sheet_py3.html", "description": "Type annotations used heavily in FastAPI and Pydantic models.", "relevance_score": 0.80, "source_domain": "mypy.readthedocs.io", "level": "Intermediate"},
        {"title": "WebSockets with FastAPI", "type": "Article", "url": "https://fastapi.tiangolo.com/advanced/websockets/", "description": "Real-time communication patterns for modern Python web apps.", "relevance_score": 0.79, "source_domain": "fastapi.tiangolo.com", "level": "Advanced"},
    ],
    "career": [
        {"title": "Python Developer Career Roadmap", "type": "Career", "url": "https://roadmap.sh/python", "description": "Step-by-step visual roadmap for Python web developer skills and milestones.", "relevance_score": 0.95, "source_domain": "roadmap.sh", "level": "All Levels"},
        {"title": "Backend Developer Career Path", "type": "Career", "url": "https://roadmap.sh/backend", "description": "Backend specialization track covering APIs, databases, and deployment.", "relevance_score": 0.94, "source_domain": "roadmap.sh", "level": "All Levels"},
        {"title": "Python Web Developer Jobs — LinkedIn", "type": "Career", "url": "https://www.linkedin.com/jobs/search/?keywords=python%20web%20developer", "description": "Browse open Python web developer roles and required skills.", "relevance_score": 0.93, "source_domain": "linkedin.com", "level": "All Levels"},
        {"title": "Indeed Python Developer Salaries", "type": "Career", "url": "https://www.indeed.com/career/python-developer/salaries", "description": "Salary benchmarks for Python developers by region and experience.", "relevance_score": 0.92, "source_domain": "indeed.com", "level": "All Levels"},
        {"title": "Glassdoor Python Web Developer", "type": "Career", "url": "https://www.glassdoor.com/Job/python-web-developer-jobs-SRCH_KO0,20.htm", "description": "Company reviews, interview tips, and compensation data.", "relevance_score": 0.91, "source_domain": "glassdoor.com", "level": "All Levels"},
        {"title": "Python Institute Certifications", "type": "Career", "url": "https://pythoninstitute.org/certification/", "description": "PCEP, PCAP, and PCPP certifications for Python developers.", "relevance_score": 0.90, "source_domain": "pythoninstitute.org", "level": "All Levels"},
        {"title": "freeCodeCamp Developer Resume Guide", "type": "Career", "url": "https://www.freecodecamp.org/news/how-to-write-a-developer-resume/", "description": "How to present Python web projects on your developer resume.", "relevance_score": 0.89, "source_domain": "freecodecamp.org", "level": "All Levels"},
        {"title": "GitHub Portfolio Best Practices", "type": "Career", "url": "https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile", "description": "Showcase FastAPI and Django projects on your GitHub profile.", "relevance_score": 0.88, "source_domain": "github.com", "level": "All Levels"},
        {"title": "Stack Overflow Developer Survey", "type": "Career", "url": "https://survey.stackoverflow.co/", "description": "Industry trends, popular frameworks, and salary insights for Python devs.", "relevance_score": 0.87, "source_domain": "stackoverflow.co", "level": "All Levels"},
        {"title": "Remote Python Jobs — We Work Remotely", "type": "Career", "url": "https://weworkremotely.com/categories/remote-programming-jobs", "description": "Remote-first Python and web development job listings.", "relevance_score": 0.86, "source_domain": "weworkremotely.com", "level": "All Levels"},
        {"title": "AngelList Python Startup Jobs", "type": "Career", "url": "https://wellfound.com/role/l/python-developer", "description": "Startup roles for Python web developers at early-stage companies.", "relevance_score": 0.85, "source_domain": "wellfound.com", "level": "All Levels"},
        {"title": "Google IT Automation Certificate", "type": "Career", "url": "https://grow.google/certificates/it-automation-python/", "description": "Professional certificate covering Python automation for IT careers.", "relevance_score": 0.84, "source_domain": "grow.google", "level": "Beginner"},
    ],
}

# Mock Quiz Questions mapped by Lesson Title (normalized)
MOCK_QUIZZES = {
    "introduction to python & setup": [
        {
            "question_id": 1,
            "type": "MCQ",
            "question": "What is the file extension used for Python source files?",
            "options": [".py", ".pyc", ".ipynb", ".txt"],
            "correct_option_idx": 0
        },
        {
            "question_id": 2,
            "type": "MCQ",
            "question": "Which tool is commonly used to install third-party Python packages?",
            "options": ["npm", "pip", "maven", "gem"],
            "correct_option_idx": 1
        },
        {
            "question_id": 3,
            "type": "TF",
            "question": "True or False: Python is a dynamically-typed language, meaning variables do not require explicit type declarations.",
            "correct_option_idx": 0
        }
    ],
    "variables, operators & types": [
        {
            "question_id": 1,
            "type": "MCQ",
            "question": "What is the output of `type(3.14)` in Python?",
            "options": ["<class 'int'>", "<class 'str'>", "<class 'float'>", "<class 'double'>"],
            "correct_option_idx": 2
        },
        {
            "question_id": 2,
            "type": "MCQ",
            "question": "Which operator is used for exponentiation (raising to a power) in Python?",
            "options": ["^", "**", "*", "e"],
            "correct_option_idx": 1
        },
        {
            "question_id": 3,
            "type": "TF",
            "question": "True or False: In Python, string variables can be declared using either single quotes ('') or double quotes (\"\").",
            "correct_option_idx": 0
        }
    ],
    "control flow & loops": [
        {
            "question_id": 1,
            "type": "MCQ",
            "question": "What is the correct syntax for an 'else if' condition in Python?",
            "options": ["else if", "elseif", "elif", "elsif"],
            "correct_option_idx": 2
        },
        {
            "question_id": 2,
            "type": "MCQ",
            "question": "Which keyword is used to immediately terminate the execution of a loop?",
            "options": ["continue", "stop", "exit", "break"],
            "correct_option_idx": 3
        },
        {
            "question_id": 3,
            "type": "TF",
            "question": "True or False: The `range(5)` function generates numbers starting from 1 up to 5.",
            "correct_option_idx": 1
        }
    ],
    "lists, tuples & dictionaries": [
        {
            "question_id": 1,
            "type": "MCQ",
            "question": "Which of the following data structures is immutable (cannot be modified after creation)?",
            "options": ["List", "Tuple", "Dictionary", "Set"],
            "correct_option_idx": 1
        },
        {
            "question_id": 2,
            "type": "MCQ",
            "question": "How do you retrieve the value of key 'name' in dictionary `user = {'name': 'ripon'}`?",
            "options": ["user.name", "user['name']", "user.get('name')", "Both options 2 and 3 are correct"],
            "correct_option_idx": 3
        },
        {
            "question_id": 3,
            "type": "TF",
            "question": "True or False: In Python, dict keys must be unique and hashable (e.g. strings or numbers).",
            "correct_option_idx": 0
        }
    ],
    "functions & scope": [
        {
            "question_id": 1,
            "type": "MCQ",
            "question": "Which keyword is used to define a function in Python?",
            "options": ["func", "def", "function", "lambda"],
            "correct_option_idx": 1
        },
        {
            "question_id": 2,
            "type": "MCQ",
            "question": "What happens if a variable is declared inside a function without the `global` keyword?",
            "options": ["It has global scope", "It has local scope", "It throws a syntax error", "It is stored in the DB"],
            "correct_option_idx": 1
        },
        {
            "question_id": 3,
            "type": "TF",
            "question": "True or False: In Python, functions can return multiple values separated by commas, which are returned as a Tuple.",
            "correct_option_idx": 0
        }
    ],
    "object-oriented programming (oop)": [
        {
            "question_id": 1,
            "type": "MCQ",
            "question": "What is the primary purpose of the `__init__` method in a Python class?",
            "options": ["To destroy class instances", "To initialize instance variables on creation", "To declare static methods", "To inherit from superclasses"],
            "correct_option_idx": 1
        },
        {
            "question_id": 2,
            "type": "MCQ",
            "question": "How does a class inherit from another class in Python syntax?",
            "options": ["class Child extends Parent:", "class Child : Parent:", "class Child(Parent):", "class Child implements Parent:"],
            "correct_option_idx": 2
        },
        {
            "question_id": 3,
            "type": "TF",
            "question": "True or False: The keyword `self` represents the specific instance of the class that is calling a method.",
            "correct_option_idx": 0
        }
    ]
}

# Default quiz fallback if lesson title not specifically mapped
DEFAULT_QUIZ = [
    {
        "question_id": 1,
        "type": "MCQ",
        "question": "Which HTTP method is typically used to create a new resource on a REST API?",
        "options": ["GET", "PUT", "POST", "DELETE"],
        "correct_option_idx": 2
    },
    {
        "question_id": 2,
        "type": "MCQ",
        "question": "What does ORM stand for in database programming?",
        "options": ["Object-Relational Mapping", "Optimal Resource Manager", "Online Query Manager", "Oracle Relation Master"],
        "correct_option_idx": 0
    },
    {
        "question_id": 3,
        "type": "TF",
        "question": "True or False: FastAPI automatically validates request parameters and returns 422 errors for validation failures.",
        "correct_option_idx": 0
    }
]

# Mock Study Notes mapped by Lesson Title (normalized)
MOCK_STUDY_NOTES = {
    "introduction to python & setup": """# Lesson: Introduction to Python & Setup

Welcome to the **Introduction to Python & Setup** lesson! In this module, you will learn how to get your system ready for Python development.

## 1. What is Python?
Python is a high-level, interpreted, general-purpose programming language. It is famous for its clean syntax, readability, and versatile ecosystem (Web Dev, AI, Data Science, Scripting).

## 2. Environment Setup
To get started:
1. **Download Python**: Visit [python.org](https://www.python.org/) and download Python 3.10+. Ensure you check the box that says **"Add Python to PATH"** during installation.
2. **Editor**: Install [Visual Studio Code (VS Code)](https://code.visualstudio.com/). Install the official **Python Extension** inside VS Code.
3. **Verify Installation**: Open your terminal (PowerShell, Command Prompt, or Bash) and execute:
   ```bash
   python --version
   pip --version
   ```

## 3. The Python Interpreter & REPL
You can run Python code interactively in the terminal by typing `python`. This starts the **REPL** (Read-Eval-Print Loop).
Type:
```python
print("Hello, EduVerse AI!")
```
To exit the REPL, type `exit()`.
""",
    "variables, operators & types": """# Lesson: Variables, Operators & Types

In this lesson, you will master the foundational components of Python: declaring variables, using arithmetic operators, and understanding data types.

## 1. Dynamic Typing & Variables
Python uses **dynamic typing**. You do not need to specify variable types explicitly; Python infers them.
```python
age = 25              # integer
price = 19.99         # float
name = "Ripon"        # string
is_valid = True       # boolean
```

## 2. Basic Arithmetic & Comparison Operators
Python offers standard operators:
* `+`, `-`, `*`, `/` (Standard operations)
* `//` (Integer division, e.g. `5 // 2 == 2`)
* `%` (Modulo/remainder, e.g. `5 % 2 == 1`)
* `**` (Exponentiation, e.g. `2 ** 3 == 8`)

Comparison operators return booleans:
`==`, `!=`, `<`, `>`, `<=`, `>=`.
""",
    "control flow & loops": """# Lesson: Control Flow & Loops

Control flow allows you to direct which blocks of code execute based on conditions or loops.

## 1. Conditional Statements
In Python, conditionals use `if`, `elif` (else if), and `else`. Note the use of indentation rather than curly braces:
```python
score = 85
if score >= 90:
    print("Grade: A")
elif score >= 80:
    print("Grade: B")
else:
    print("Grade: C")
```

## 2. Iteration (Loops)
### For Loops
Commonly used to iterate over ranges, lists, or sequences:
```python
for i in range(3):
    print(f"Iteration {i}")  # Prints 0, 1, 2
```

### While Loops
Executes as long as a condition is true:
```python
count = 3
while count > 0:
    print(count)
    count -= 1
```
Use `break` to exit loops early, and `continue` to skip to the next iteration.
""",
    "lists, tuples & dictionaries": """# Lesson: Lists, Tuples & Dictionaries

Python has powerful built-in collection types to handle groups of data.

## 1. Lists (Mutable Sequence)
Lists are ordered and mutable. Defined using square brackets `[]`:
```python
fruits = ["apple", "banana"]
fruits.append("cherry")
print(fruits[0])  # "apple"
```

## 2. Tuples (Immutable Sequence)
Tuples are ordered and immutable. Defined using parentheses `()`:
```python
coordinates = (10, 20)
# coordinates[0] = 5  # Throws a TypeError!
```

## 3. Dictionaries (Key-Value Pairs)
Dicts store mapped values. Keys must be unique and hashable. Defined using `{}`:
```python
user = {
    "username": "ripon",
    "email": "ripon@gmail.com"
}
print(user["username"])  # "ripon"
```
""",
    "functions & scope": """# Lesson: Functions & Scope

Functions are blocks of organized, reusable code that perform specific actions.

## 1. Defining Functions
Use the `def` keyword, followed by parameters and an indented block:
```python
def greet(name="Student"):
    return f"Welcome to EduVerse, {name}!"

msg = greet("Ripon")
print(msg)
```

## 2. Global vs Local Scope
* **Local Scope**: Variables defined inside a function.
* **Global Scope**: Variables defined in the main module.
Use `global` to modify global variables from inside a local scope:
```python
counter = 0
def increment():
    global counter
    counter += 1
```
""",
    "object-oriented programming (oop)": """# Lesson: Object-Oriented Programming (OOP)

OOP allows you to structure programs by bundling related properties and behaviors into individual objects.

## 1. Classes and Objects
A **Class** is a blueprint, and an **Object** is an instance:
```python
class Student:
    def __init__(self, username, skill_level):
        self.username = username
        self.skill_level = skill_level

    def study(self):
        return f"{self.username} is practicing Python!"

# Create instance
ripon = Student("ripon", "Beginner")
print(ripon.study())
```

## 2. Core Concepts
* **Inheritance**: Subclasses inherit methods from a parent class.
* **Encapsulation**: Private variables (e.g. `self._secret`) to protect data.
* **Polymorphism**: Defining methods with the same name across different classes.
"""
}

DEFAULT_STUDY_NOTES = """# Lesson: Web Development & FastAPI Fundamentals

In this section, we study how to build secure backend APIs.

## 1. Web Architecture
Web applications operate in a client-server configuration:
* **Client**: React frontend making HTTP fetch requests.
* **Server**: FastAPI app reading requests and querying databases.

## 2. FastAPI Endpoint Example
```python
from fastapi import FastAPI
app = FastAPI()

@app.get("/api/status")
def get_status():
    return {"status": "operational", "engine": "mock"}
```

## 3. Database connection
ORM (Object Relational Mapping) connects relational tables to Python objects using frameworks like SQLAlchemy.
"""

# Mock streaming responses for Tutor Chat
MOCK_TUTOR_CHAT = [
    {
        "keywords": ["hello", "hi", "hey"],
        "response": "Hello Ripon! I am your AI study companion. I've prepared your complete Python Web Developer learning path. What topic should we dive into first?"
    },
    {
        "keywords": ["roadmap", "milestone", "lessons"],
        "response": "Your Python Web Developer Roadmap consists of 5 Milestones:\n1. Python Basics & Environment\n2. Data Structures & OOP\n3. Database Design & Integration\n4. Building APIs with FastAPI\n5. Containers & Cloud Deployment.\n\nYou should start with 'Introduction to Python & Setup'!"
    },
    {
        "keywords": ["python", "why learn", "what is"],
        "response": "Python is a powerful, high-level programming language known for clean syntax. It is the language of choice for modern Web APIs (FastAPI/Django) as well as AI Agents, which makes it perfect for your goal!"
    },
    {
        "keywords": ["fastapi", "rest api", "endpoint"],
        "response": "FastAPI is a modern, fast (high-performance) web framework for building APIs with Python 3.10+. It uses standard Python type hints to validate input (via Pydantic) and auto-generates Swagger documentation instantly."
    },
    {
        "keywords": ["help", "tutor", "explain"],
        "response": "I can help explain any programming concepts, provide code examples, review logic, or prepare you for quizzes. Tell me what topic you're currently stuck on!"
    }
]

DEFAULT_TUTOR_CHAT = "That is an excellent point regarding Python development! When building web applications, keeping code modular, writing unit tests, and securing database operations with an ORM are core industry practices. Do you want to review sample code or discuss this topic further?"

def get_mock_response(prompt: str, class_name: str, system_instruction: str = None) -> str:
    prompt_lower = prompt.lower()
    
    # 1. PlannerAgent - generate_roadmap_data
    if class_name == "PlannerAgent":
        if "generate remedial" in prompt_lower or "revision" in prompt_lower:
            # generate_revision_lessons
            topic = "General Coding"
            if "weaknesses" in prompt_lower:
                match = re.search(r"topic:\s*'(.*?)'", prompt)
                if match:
                    topic = match.group(1)
            return json.dumps([
                {
                    "title": f"Remedial Concept: {topic} Principles",
                    "description": "A comprehensive review of core errors, syntax issues, and debugging strategies.",
                    "estimated_time": 20
                }
            ])
        else:
            # generate_roadmap_data
            return json.dumps(MOCK_ROADMAP)
            
    # 2. ResearchAgent
    elif class_name == "ResearchAgent":
        # Career path JSON (roles/skills) vs resource search (URLs)
        if ("roles and salary" in prompt_lower or "career roadmap json" in prompt_lower) and "json array" not in prompt_lower:
            return json.dumps(MOCK_CAREER_PATHS)

        intent = "resources"
        if system_instruction:
            sys_inst_lower = system_instruction.lower()
            if "career" in sys_inst_lower:
                intent = "career"
            elif "docs" in sys_inst_lower or "documentation" in sys_inst_lower:
                intent = "docs"
            elif "course" in sys_inst_lower:
                intent = "courses"
            elif "book" in sys_inst_lower:
                intent = "books"

        return json.dumps(MOCK_RESOURCES.get(intent, MOCK_RESOURCES["resources"]))
        
    # 3. QuizAgent
    elif class_name == "QuizAgent":
        # Search for matching lesson title in prompt
        matched_quiz = None
        for title, questions in MOCK_QUIZZES.items():
            if title in prompt_lower:
                matched_quiz = questions
                break
        if matched_quiz:
            return json.dumps(matched_quiz)
        return json.dumps(DEFAULT_QUIZ)
        
    # 4. TutorAgent - generate_study_notes
    elif class_name == "TutorAgent":
        # Search for matching lesson title in prompt
        matched_notes = None
        for title, notes in MOCK_STUDY_NOTES.items():
            if title in prompt_lower:
                matched_notes = notes
                break
        if matched_notes:
            return matched_notes
        return DEFAULT_STUDY_NOTES
        
    return None

def get_tutor_chat_response(message: str) -> str:
    msg_lower = message.lower()
    for item in MOCK_TUTOR_CHAT:
        for keyword in item["keywords"]:
            if keyword in msg_lower:
                return item["response"]
    return DEFAULT_TUTOR_CHAT
