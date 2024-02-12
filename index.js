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
    console.log(decoratedArray);
    return decoratedArray;
  });
