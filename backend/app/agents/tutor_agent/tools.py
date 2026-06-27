def retrieve_glossary_term(term: str) -> str:
    """
    Looks up specific terminology definition.
    """
    glossary = {
        "variable": "A named container in memory used to store data values.",
        "function": "A reusable block of code that executes a specific action when invoked.",
        "recursion": "A programming technique where a function calls itself to solve smaller sub-instances."
    }
    return glossary.get(term.lower(), "Definition not found in glossary.")
