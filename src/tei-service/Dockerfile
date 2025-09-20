# syntax=docker/dockerfile:1

########## Stage 1: download the model into the image (no token) ##########
FROM python:3.11-slim AS dl

# Pick your model & revision at build time (see commands below)
ARG MODEL_ID=sentence-transformers/all-MiniLM-L6-v2
ARG MODEL_REVISION=main

# Keep first build conservative (fewer parallel connections)
ENV PIP_NO_CACHE_DIR=1 HF_HUB_ENABLE_HF_TRANSFER=0

# TLS + git for some repos
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates git && \
    rm -rf /var/lib/apt/lists/*

RUN pip install "huggingface_hub[cli]>=0.23.0"
RUN mkdir -p /models/model

# Download model files into the image (no token)
RUN python - <<'PY'
import os
from huggingface_hub import snapshot_download
repo = os.environ["MODEL_ID"]
rev  = os.environ.get("MODEL_REVISION","main")
snapshot_download(
    repo_id=repo,
    revision=rev,
    local_dir="/models/model",
    local_dir_use_symlinks=False
)
print("Downloaded", repo, "@", rev, "to /models/model")
PY

########## Stage 2: TEI runtime (CPU) ##########
# Use a CPU-only TEI image. Two working options:

# Option A (Google DLC – CPU):
FROM gcr.io/deeplearning-platform-release/huggingface-text-embeddings-inference-cpu.1-6

# Option B (if you know the GHCR CPU tag you want to use):
# FROM ghcr.io/huggingface/text-embeddings-inference:cpu-1.8

COPY --from=dl /models/model /models/model

ENV TOKENIZERS_PARALLELISM=false \
    HF_HUB_ENABLE_HF_TRANSFER=1 \
    MAX_CONCURRENT_REQUESTS=64

EXPOSE 8080
ENTRYPOINT ["/bin/sh","-lc","exec text-embeddings-router \
  --model-id=/models/model \
  --hostname=0.0.0.0 \
  --port ${PORT:-8080} \
  --max-concurrent-requests ${MAX_CONCURRENT_REQUESTS}"]