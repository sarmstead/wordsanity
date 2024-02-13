const { createClient } = require("@sanity/client");
const fs = require("node:fs");
const https = require("https");

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  useCdn: true,
  apiVersion: "2024-02-11",
  token: process.env.SANITY_TOKEN,
});

const tempDir = "./tmp/";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createTmpFile = (imageUrl, filename) =>
  new Promise((resolve, reject) => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const imageName = tempDir + filename;
    const file = fs.createWriteStream(imageName);
    https
      .get(imageUrl, (response) => {
        response.pipe(file);

        file.on("finish", () => {
          file.close();
          resolve(imageName);
        });
      })
      .on("error", (err) => {
        fs.unlink(imageName);
        reject(`Error downloading image: ${err.message}`);
      });
  });

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
    decoratedArray.forEach((blog, index) => {
      wait(index * 15000).then(() => {
        if (blog.featuredImage) {
          createTmpFile(blog.featuredImage[0].url, blog.title).then((file) => {
            client.assets
              .upload("image", fs.createReadStream(file), {
                filename: blog.title,
              })
              .then((image) => {
                const params = {
                  _type: "journal",
                  metaDescription: blog.metaDescription,
                  title: blog.title,
                  slug: { _type: "slug", current: blog.slug },
                  publishDate: blog.date,
                  body: blog.body,
                  authors: [
                    {
                      _type: "reference",
                      _ref: process.env.SANITY_MAIN_AUTHOR_ID,
                      _key: process.env.SANITY_MAIN_AUTHOR_KEY,
                    },
                  ],
                  categories: [
                    {
                      _type: "reference",
                      _ref:
                        blog.category.toLowerCase() === "journal"
                          ? process.env.SANITY_CATEGORY_JOURNAL_ID
                          : process.env.SANITY_CATEGORY_CREATMOTEO_ID,
                      _key:
                        blog.category.toLowerCase() === "journal"
                          ? process.env.SANITY_CATEGORY_JOURNAL_KEY
                          : process.env.SANITY_CATEGORY_CREATMOTEO_KEY,
                    },
                  ],
                  featuredImage: {
                    _type: "image",
                    asset: {
                      _ref: image["_id"],
                      _type: "reference",
                    },
                  },
                };

                client
                  .create(params)
                  .then(() => {
                    fs.rm(tempDir, { recursive: true, force: true }, (err) => {
                      if (err) {
                        throw err;
                      }
                    });
                  })
                  .catch(console.error);
              })
              .catch((error) => console.error(error));
          });
        }

        console.log(`${blog.title} does not have a featured image`);
      });
    });
  });
