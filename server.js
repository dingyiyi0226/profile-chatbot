import cors from 'cors';
import express from 'express';
import line from '@line/bot-sdk';
import ngrok from 'ngrok'

let baseURL = process.env.BASE_URL;
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};
const client = new line.Client(config);

const app = express();
app.use(cors());
app.use('/webhook', line.middleware(config))
app.use(express.json());


app.post('/webhook', (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// simple reply function
const replyText = (token, texts) => {
  texts = Array.isArray(texts) ? texts : [texts];
  return client.replyMessage(
    token,
    texts.map((text) => ({ type: 'text', text }))
  );
};

function handleEvent(event) {
  switch (event.type) {
    case 'message':
      const message = event.message;
      switch (message.type) {
        case 'text':
          return handleText(message, event.replyToken, event.source);
        default:
          return console.log(`not handle message: ${JSON.stringify(message)}`);
      }

    case 'follow':
      return handleFollow(event.replyToken, event.source);

    case 'leave':
      return console.log(`Left: ${JSON.stringify(event)}`);

    case 'postback':
      let data = event.postback.data;
      if (data === 'DATE' || data === 'TIME' || data === 'DATETIME') {
        data += `(${JSON.stringify(event.postback.params)})`;
      }
      return replyText(event.replyToken, `Got postback: ${data}`);

    default:
      return console.log(`not handle event: ${JSON.stringify(event)}`);
  }
}

function handleFollow(replyToken, source) {
  console.log('follow: ', source)

  if (source.userId) {
    return client.getProfile(source.userId)
      .then((profile) => client.replyMessage(
        replyToken,
        [
          {
            type: 'text',
            text: `Hi ${profile.displayName} $`,
            emojis: [
              {
                index: 4+profile.displayName.length,
                productId: '5ac1bfd5040ab15980c9b435',
                emojiId: '003'
              },
            ],
          },
          {
            type: 'text',
            text: 'Select anything to know more about me!',
          },
          {
            type: 'text',
            text: 'Enter `options` to show all supported options',
            quickReply: {
              items: [
                {
                  type: 'action',
                  action: {
                    type: 'message',
                    label: 'Education',
                    text: 'education'
                  }
                },
                {
                  type: 'action',
                  action: {
                    type: 'message',
                    label: 'Skills',
                    text: 'skills'
                  }
                },
                {
                  type: 'action',
                  action: {
                    type: 'message',
                    label: 'Side projects',
                    text: 'side projects'
                  }
                },
              ]
            },
          },
        ]
      ));
  } else {
    return replyText(replyToken, 'Bot can\'t use profile API without user ID');
  }
}

function handleText(message, replyToken, source) {

  switch (message.text.trim().toLowerCase()) {
    case 'options':
      return client.replyMessage(
        replyToken,
        {
          type: 'template',
          altText: 'Options alt text',
          template: {
            type: 'buttons',
            title: 'Avalible options',
            text: 'this is text',
            actions: [
              { label: 'Education', type: 'message', text: 'education' },
              { label: 'Side projects', type: 'message', text: 'side projects' },
              { label: 'Skills', type: 'message', text: 'skills' },
            ]
          }
        }
      );

    case 'education':
      return client.replyMessage(
        replyToken,
        [
          {
            type: 'text',
            text: 'B.S. in Electrical Engineering, National Taiwan University (September 2017 - June 2021 (Expected))'
          },
          {
            type: 'text',
            text: 'Undergraduate researcher in Wireless Mobile Network Laboratory, NTU (July 2020 - Present)'
          },
          {
            type: 'text',
            text: 'Undergraduate researcher in Advanced Antenna Laboratory, NTU (September 2019 - July 2020)'
          },
        ]
      );

    case 'skills':
      return client.replyMessage(
        replyToken,
        [
          {
            type: 'text',
            text: 'Python, C++'
          },
          {
            type: 'text',
            text: 'WebDev: JavaScript, html, css, ReactJS, nodeJS'
          },
          {
            type: 'text',
            text: 'Cloud Service: Google Cloud Platform'
          },
        ]
      );

    case 'side projects':
      return client.replyMessage(
        replyToken,
        {
          type: 'template',
          altText: 'Side projects alt text',
          template: {
            type: 'carousel',
            columns: [
              {
                title: 'tripago',
                text: 'An album platform to record and share your trips',
                actions: [
                  { label: 'Go to github repo', type: 'uri', uri: 'https://github.com/dingyiyi0226/tripago' },
                ],
              },
              {
                title: 'police assistant',
                text: 'A decentralized police assistant',
                actions: [
                  { label: 'Go to github repo', type: 'uri', uri: 'https://github.com/dingyiyi0226/police-assistant' },
                ],
              },
              {
                title: 'catcatcat',
                text: 'An IoT cat feeder controlled by iOS app',
                actions: [
                  { label: 'Go to github repo', type: 'uri', uri: 'https://github.com/dingyiyi0226/catcatcat' },
                ],
              },
            ],
          },
        }
      );

    default:
      console.log(`Receive message: ${message.text}`);
      return;
  }
}

const port = process.env.PORT || 4000
app.listen(port, () => {
  // if (baseURL) {
  //   console.log(`listening on ${baseURL}:${port}/webhook`);
  // } else {
  //   console.log("It seems that BASE_URL is not set. Connecting to ngrok...")
  //   ngrok.connect(port).then(url => {
  //     baseURL = url;
  //     console.log(`listening on ${baseURL}/webhook`);
  //   }).catch(console.error);
  // }
  console.log(`Server is up on port ${port}.`)
});
