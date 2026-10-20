from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class DocumentMetadata(BaseModel):
    id: str
    title: str
    document_type: str  # e.g., 'invoice', 'warranty', 'utility_bill', 'claim'
    file_name: str
    upload_date: str
    page_count: int
    status: str = "PROCESSED"
    tags: List[str] = Field(default_factory=list)

class ExtractedField(BaseModel):
    key: str
    value: Any
    confidence: float
    page: int
    raw_text: str

class DocumentAnalysis(BaseModel):
    document_id: str
    document_type: str
    title: str
    page_count: int
    summary: str
    fields: Dict[str, ExtractedField] = Field(default_factory=dict)
    raw_text_by_page: Dict[int, str] = Field(default_factory=dict)
