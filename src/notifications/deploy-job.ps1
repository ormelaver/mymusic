docker build -t europe-west1-docker.pkg.dev/mymusic-434611/notification-service/notification-job:latest .

docker push europe-west1-docker.pkg.dev/mymusic-434611/notification-service/notification-job:latest

gcloud run jobs update notification-job --image europe-west1-docker.pkg.dev/mymusic-434611/notification-service/notification-job:latest --region europe-west1 --command "node" --args "dist/index.js"