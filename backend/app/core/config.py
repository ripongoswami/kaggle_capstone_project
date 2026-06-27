import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    DATABASE_URL: str = Field(default="sqlite:///./eduverse.db")
    JWT_SECRET: str = Field(default="super_secret_jwt_sign_key_change_me_in_production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=600)
    
    GEMINI_API_KEY: str = Field(default="")
    TAVILY_API_KEY: str = Field(default="")

    # Set to false when GEMINI_API_KEY is provided to use real LLM calls
    USE_MOCK_AGENTS: bool = Field(default=True)

    # Route agent LLM calls to local Assistant Bridge (Cursor agent generates responses)
    ASSISTANT_LLM_BRIDGE: bool = Field(default=False)
    ASSISTANT_LLM_BRIDGE_URL: str = Field(default="http://127.0.0.1:9999")

    BACKEND_PORT: int = Field(default=8000)
    FRONTEND_PORT: int = Field(default=3000)

settings = Settings()
