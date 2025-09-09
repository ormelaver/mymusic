docker build -t europe-west1-docker.pkg.dev/mymusic-434611/mymusic-core-service/core:latest .
docker push europe-west1-docker.pkg.dev/mymusic-434611/mymusic-core-service/core:latest
gcloud run deploy core --image europe-west1-docker.pkg.dev/mymusic-434611/mymusic-core-service/core:latest --region europe-west1 --platform managed