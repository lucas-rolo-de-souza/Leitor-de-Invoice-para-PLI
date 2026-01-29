from pydantic import BaseModel
from typing import List, Optional

class LineItem(BaseModel):
    description: str
    partNumber: Optional[str] = None
    quantity: float
    unitMeasure: str
    unitPrice: float
    total: float
    netWeight: float
    manufacturerRef: Optional[str] = None
    ncm: Optional[str] = None
    
    # Defaults for fields not extracted by AI but present in frontend type
    productCode: Optional[str] = None
    taxClassificationDetail: Optional[str] = None
    unitNetWeight: Optional[float] = 0
    weightUnit: str = "KG"

class InvoiceData(BaseModel):
    invoiceNumber: Optional[str] = None
    date: Optional[str] = None
    exporterName: Optional[str] = None
    importerName: Optional[str] = None
    currency: Optional[str] = None
    grandTotal: float = 0
    incoterm: Optional[str] = None
    
    # Full list from schema
    exporterAddress: Optional[str] = None
    exporterTaxId: Optional[str] = None
    importerAddress: Optional[str] = None
    importerTaxId: Optional[str] = None
    countryOfOrigin: Optional[str] = None
    countryOfAcquisition: Optional[str] = None
    countryOfProvenance: Optional[str] = None
    portOfLoading: Optional[str] = None
    portOfDischarge: Optional[str] = None
    totalNetWeight: float = 0
    totalGrossWeight: float = 0
    totalPackages: int = 0
    volumeType: Optional[str] = None
    paymentTerms: Optional[str] = None
    freightValue: float = 0
    insuranceValue: float = 0
    otherChargesValue: float = 0
    
    lineItems: List[LineItem] = []
