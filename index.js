'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const util = require('util');

// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

//youtube api information
const searchUrl = 'https://www.googleapis.com/youtube/v3/search';
const baseQuery = {
	part: 'snippet',
	type: 'video',
	maxResults: 50,
	key: process.env.YOUTUBE_SECRET
};
const baseVideoUrl = 'https://www.youtube.com/watch';

// create LINE SDK client
const client = new line.Client(config);

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// event handler
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

// youtube api searching
	const searchText = event.message.text;
	const query = { q: searchText };
	const qs = querystring.stringify(Object.assign(baseQuery, query));
	const requestUrl = util.format('%s?%s', searchUrl, qs);
	console.log(requestUrl);
	const ifnum = 1;

	const searchResults = await axios.get(requestUrl);
	const videoQuery = { v: searchResults.data.items[0].id.videoId };
	const vqs = querystring.stringify(videoQuery);
	const videoUrl = util.format('%s?%s', baseVideoUrl, vqs);
	console.log(videoUrl);

	  // create a echoing text message
		const echo =[
			{
				type: 'text',
				text: `"${searchText}"のレコメンド動画はこちらです！`
			},
			{
				type: 'text',
				text: videoUrl
			}
		];

  // use reply API
  return client.replyMessage(event.replyToken, echo);
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
