npm ci
npm run build:local
gcloud functions deploy startYoutubeSearch --gen2 --runtime nodejs20 --region europe-west1 --trigger-http --entry-point startYoutubeSearch