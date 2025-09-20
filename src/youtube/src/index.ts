import 'dotenv/config';
import YoutubeClient from './service/youtube';
import DatastoreClient from './utils/dsClient';

export async function startYoutubeSearch(req: any, res: any) {
  console.log('Starting up...');
  try {
    await DatastoreClient.getInstance();
    const youtubeClient = new YoutubeClient();
    console.log('Youtube search started...');
    await youtubeClient.initSearch();
    console.log('Youtube search completed.');
    res.status(200).send('YouTube search completed successfully');
  } catch (error: any) {
    console.error('Error running YouTube search:', error);
    res.status(500).send(error);
  }
}

//startYoutubeSearch({}, {}); // For local testing
