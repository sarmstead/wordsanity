const { createClient } = require("@sanity/client");
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  useCdn: true,
  apiVersion: "2024-02-11",
  token: process.env.SANITY_TOKEN,
});

// Expected payload for client.create
const params = {
  _type: "journal",
  metaDescription:
    "Imagine an undistracted news experience. No ads, no photos, no videos—just text. Now picture multiple text-only sources in one place. This is Abate.",
  title: "From the API",
  slug: { _type: "slug", current: "from-the-api" },
  publishDate: "2024-02-12T01:59:51.023Z",
  body: "Foo bar",
  authors: [
    {
      _type: "reference",
      _ref: "de711167-b03f-4bde-928b-a93bc315b13d",
      _key: "85a1bef0f627",
    },
  ],
  categories: [
    {
      _type: "reference",
      _ref: "19f18130-1579-4c63-a956-6433ae6217a8",
      _key: "8209d16ed346",
    },
  ],
  featuredImage: {
    _type: "image",
    asset: {
      _ref: "image-0463ad48b23523b66a11fd0e2807a945039c11fb-1280x853-jpg",
      _type: "reference",
    },
  },
};
client
  .create(params)
  .then((data) => console.log(data))
  .catch(console.error);

// STEPS TO ADD BLOGS TO SANITY
// (1) Create the image asset (https://www.sanity.io/docs/assets)
// - You'll need to pull down the asset from WordPress using fetch(), and the createReadStream with that data?
// - Returned _id property is the featuredImage.asset["_ref"] value
// (2)Create the journal document
// - If the payload from WordPress returns a category of "journal" do this, if it returns "creatmoteo" do that, etc.

fetch(`${process.env.WORDPRESS_BASE}/wp-json/wp/v2/posts?per_page=100`)
  .then((response) => response.json())
  .then((posts) => {
    return posts.map((post) => {
      let category;

      if (post.categories[0] == 40) {
        category = "journal";
      } else if (post.categories[0] == 41) {
        category = "creatmoteo";
      } else {
        category = "uncategorized";
      }

      return {
        date: post.yoast_head_json.article_published_time,
        slug: post.slug,
        status: post.status,
        title: post.title.rendered,
        body: post.content.rendered,
        metaDescription: post.yoast_head_json.description,
        author: post.yoast_head_json.author,
        featuredImage: post.yoast_head_json.og_image,
        category: category,
      };
    });
  })
  .then((decoratedArray) => {
    // console.log(decoratedArray);
    return decoratedArray;
  });
