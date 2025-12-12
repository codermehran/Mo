from fastapi import FastAPI

app = FastAPI(title="Beauty Platform API")


@app.get("/")
def read_root():
    return {"message": "Beauty Platform backend is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
