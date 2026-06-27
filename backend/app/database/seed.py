from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.user import User
from app.models.roadmap import Roadmap
from app.models.lesson import Lesson

def seed_db(db: Session):
    # 1. Create Default Test User
    test_user = db.query(User).filter(User.email == "student@eduverse.ai").first()
    if not test_user:
        test_user = User(
            username="student",
            email="student@eduverse.ai",
            hashed_password=get_password_hash("Password123"),
            goal="Python Programming and AI Agents",
            skill_level="Beginner",
            daily_study_time=45,
            target_date="2026-12-31"
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)

    # 2. Create Default Roadmap for Test User
    test_roadmap = db.query(Roadmap).filter(Roadmap.user_id == test_user.id).first()
    if not test_roadmap:
        test_roadmap = Roadmap(
            user_id=test_user.id,
            title="Introduction to Python & Generative AI",
            progress=25.0,
            streak=3,
            career_readiness=25.0,
            missing_skills='["Object-Oriented Programming", "Algorithm Design", "Gemini API integration"]',
            target_roles='["Junior Python Developer", "AI Engineer", "Machine Learning Intern"]',
            certifications='["Google Cloud Professional Machine Learning Engineer", "Python Institute PCAP"]'
        )
        db.add(test_roadmap)
        db.commit()
        db.refresh(test_roadmap)

        # 3. Create Default Lessons
        import json
        lessons = [
            Lesson(
                roadmap_id=test_roadmap.id,
                title="Python Syntax and Variables",
                description="Learn basic types, strings, numbers, and basic expressions in Python.",
                milestone_title="Milestone 1: Python Essentials",
                difficulty="Beginner",
                estimated_time=30,
                status="Completed",
                order=1,
                study_notes="""# Lesson 1: Python Syntax and Variables

Welcome to your first lesson in Python! Python is a high-level, interpreted programming language known for its clean syntax and readability.

## Variables and Data Types
In Python, you declare variables by assigning them a value using the `=` operator. Python is dynamically typed, so you do not need to declare the type of a variable.

```python
# Numbers
age = 25          # Integer
price = 19.99     # Float

# Text
name = "EduVerse Student"  # String

# Booleans
is_learning = True
```

## Basic Input and Output
You print outputs using the `print()` function, and read inputs using `input()`.

```python
print(f"Hello {name}, your age is {age}.")
```
""",
                resources=json.dumps([
                    {
                        "title": "Python Syntax - W3Schools Reference",
                        "type": "Docs",
                        "url": "https://www.w3schools.com/python/python_syntax.asp",
                        "description": "Quick reference guide on variables, syntax, and keywords in Python.",
                        "relevance_score": 0.95,
                        "source_domain": "w3schools.com"
                    },
                    {
                        "title": "Python for Beginners - freeCodeCamp Video Course",
                        "type": "YouTube",
                        "url": "https://www.youtube.com/watch?v=rfscVS0vtbw",
                        "description": "Comprehensive 4-hour video course covering variables and syntax rules.",
                        "relevance_score": 0.90,
                        "source_domain": "youtube.com"
                    }
                ]),
                quiz_questions=json.dumps([
                    {
                        "question_id": 1,
                        "type": "MCQ",
                        "question": "Which operator is used to assign values to variables in Python?",
                        "options": ["==", "=", "=>", "::"],
                        "correct_option_idx": 1
                    },
                    {
                        "question_id": 2,
                        "type": "TF",
                        "question": "True or False: You must declare variable types explicitly in Python.",
                        "options": ["True", "False"],
                        "correct_option_idx": 1
                    }
                ])
            ),
            Lesson(
                roadmap_id=test_roadmap.id,
                title="Control Flow and Functions",
                description="Understand if-statements, loops, and writing reusable functions.",
                milestone_title="Milestone 1: Python Essentials",
                difficulty="Beginner",
                estimated_time=45,
                status="Current",
                order=2,
                study_notes="""# Lesson 2: Control Flow and Functions

Control flow allows your program to make decisions and execute specific blocks of code. Functions help you package code into reusable blocks.

## Conditional Statements (if-else)
Use `if`, `elif`, and `else` to branching logic based on boolean values.

```python
x = 10
if x > 5:
    print("x is greater than 5")
elif x == 5:
    print("x is exactly 5")
else:
    print("x is less than 5")
```

## Loops
Python provides `for` loops (to iterate over sequences) and `while` loops (to repeat while a condition holds true).

```python
# For loop
for i in range(3):
    print(f"Iteration {i}")

# While loop
count = 0
while count < 3:
    print(count)
    count += 1
```

## Reusable Functions
Functions are declared using the `def` keyword.

```python
def greet_user(username):
    return f"Welcome back, {username}!"

print(greet_user("Alex"))
```
""",
                resources=json.dumps([
                    {
                        "title": "Python Control Flow Docs",
                        "type": "Docs",
                        "url": "https://docs.python.org/3/tutorial/controlflow.html",
                        "description": "Official Python documentation covering if statements, for loops, and function definitions.",
                        "relevance_score": 0.98,
                        "source_domain": "docs.python.org"
                    },
                    {
                        "title": "Python Loops and Functions Tutorial",
                        "type": "Article",
                        "url": "https://realpython.com/defining-your-own-python-function/",
                        "description": "In-depth guide by Real Python on function parameters, scoping, and loops.",
                        "relevance_score": 0.92,
                        "source_domain": "realpython.com"
                    }
                ]),
                quiz_questions=json.dumps([
                    {
                        "question_id": 1,
                        "type": "MCQ",
                        "question": "Which keyword is used to declare a function in Python?",
                        "options": ["function", "def", "func", "declare"],
                        "correct_option_idx": 1
                    },
                    {
                        "question_id": 2,
                        "type": "TF",
                        "question": "True or False: Indentation is syntactically mandatory in Python to define code blocks.",
                        "options": ["True", "False"],
                        "correct_option_idx": 0
                    },
                    {
                        "question_id": 3,
                        "type": "SA",
                        "question": "Write a Python statement to generate a sequence of numbers from 0 to 4 (inclusive)."
                    }
                ])
            ),
            Lesson(
                roadmap_id=test_roadmap.id,
                title="Data Structures and Modules",
                description="Deep dive into lists, dictionaries, tuples, and importing packages.",
                milestone_title="Milestone 1: Python Essentials",
                difficulty="Intermediate",
                estimated_time=45,
                status="Locked",
                order=3,
                study_notes="""# Lesson 3: Data Structures and Modules

Data structures store collections of elements, while modules help import external libraries.

## Lists, Tuples, and Dictionaries
- **Lists** are ordered, mutable collections: `my_list = [1, 2, 3]`
- **Tuples** are ordered, immutable collections: `my_tuple = (1, 2, 3)`
- **Dictionaries** are key-value mappings: `my_dict = {"key": "value"}`

```python
# List operations
fruits = ["apple", "banana"]
fruits.append("cherry")

# Dictionary lookup
person = {"name": "Bob", "role": "Developer"}
print(person["name"])
```

## Importing Modules
You can import modules using the `import` statement.

```python
import math
print(math.sqrt(16)) # 4.0
```
""",
                resources=json.dumps([
                    {
                        "title": "Python Data Structures Reference",
                        "type": "Docs",
                        "url": "https://docs.python.org/3/tutorial/datastructures.html",
                        "description": "Official guide on list comprehension, dictionary nesting, and tuple packing.",
                        "relevance_score": 0.95,
                        "source_domain": "docs.python.org"
                    }
                ]),
                quiz_questions=json.dumps([
                    {
                        "question_id": 1,
                        "type": "MCQ",
                        "question": "Which data structure is immutable in Python?",
                        "options": ["List", "Dictionary", "Tuple", "Set"],
                        "correct_option_idx": 2
                    }
                ])
            ),
            Lesson(
                roadmap_id=test_roadmap.id,
                title="Introduction to LLMs and Gemini",
                description="Explore prompt engineering, temperature settings, and the Gemini API.",
                milestone_title="Milestone 2: AI foundations",
                difficulty="Beginner",
                estimated_time=60,
                status="Locked",
                order=4,
                study_notes="""# Lesson 4: Introduction to LLMs and Gemini

Learn how to connect Python applications to large language models like Google Gemini.

## API Integration
Using the new `google.genai` SDK, you can generate content with simple client calls.

```python
from google import genai

client = genai.Client()
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents='Tell me a programming joke.'
)
print(response.text)
```
""",
                resources=json.dumps([
                    {
                        "title": "Google GenAI SDK Documentation",
                        "type": "Docs",
                        "url": "https://github.com/google/generative-ai-python",
                        "description": "GitHub repository and API documentation for google-genai.",
                        "relevance_score": 0.97,
                        "source_domain": "github.com"
                    }
                ]),
                quiz_questions=json.dumps([
                    {
                        "question_id": 1,
                        "type": "MCQ",
                        "question": "Which Python package is the modern client for Google GenAI?",
                        "options": ["google-generativeai", "google-genai", "google-gemini", "gemini-sdk"],
                        "correct_option_idx": 1
                    }
                ])
            )
        ]
        db.bulk_save_objects(lessons)
        db.commit()
        print("Database successfully seeded with default student credentials, roadmap, and rich study package.")
    else:
        print("Database already has test data, skipping seed.")

