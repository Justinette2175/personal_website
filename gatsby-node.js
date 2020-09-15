const path = require("path")
const { createFilePath } = require(`gatsby-source-filesystem`)

exports.createPages = async ({ actions, graphql, reporter }) => {
  const { createPage } = actions

  //const blogPost = path.resolve(`./src/templates/blog-post.js`)
  const blogList = path.resolve(`./src/templates/blog-list.js`)
  const cart360List = path.resolve(`./src/templates/cart360-list.js`)

  const result = await graphql(`
    {
      allMarkdownRemark(sort: { order: DESC, fields: [frontmatter___date] }) {
        edges {
          node {
            id
            frontmatter {
              slug
              template
              title
              collection
            }
          }
        }
      }
    }
  `)

  // Handle errors
  if (result.errors) {
    reporter.panicOnBuild(`Error while running GraphQL query.`)
    return
  }

  // Create markdown pages
  const posts = result.data.allMarkdownRemark.edges
  let blogPostsCount = 0
  let cart360Count = 0

  posts.forEach((post, index) => {
    const id = post.node.id
    const previous = index === posts.length - 1 ? null : posts[index + 1].node
    const next = index === 0 ? null : posts[index - 1].node

    createPage({
      path: post.node.frontmatter.slug,
      component: path.resolve(
        `src/templates/${String(post.node.frontmatter.template)}.js`
      ),
      // additional data can be passed via context
      context: {
        id,
        previous,
        next,
      },
    })

    // Count blog posts.
    if (post.node.frontmatter.collection === "blog") {
      blogPostsCount++
    }

    // Count CART360 posts.
    if (post.node.frontmatter.collection === "cart360") {
      cart360Count++
    }
  })

  // Create blog-list pages
  const postsPerPage = 12
  const numBlogPages = Math.ceil(blogPostsCount / postsPerPage)
  const numCart360Pages = Math.ceil(cart360Count / postsPerPage)

  console.log("NUMBER OF  BLOG PAGES", numBlogPages)
  Array.from({ length: numBlogPages }).forEach((_, i) => {
    createPage({
      path: i === 0 ? `/blog` : `/blog/${i + 1}`,
      component: blogList,
      context: {
        limit: postsPerPage,
        skip: i * postsPerPage,
        numBlogPages,
        currentPage: i + 1,
      },
    })
  })

  Array.from({ length: numCart360Pages }).forEach((_, i) => {
    createPage({
      path: i === 0 ? `/cart360` : `/cart360/${i + 1}`,
      component: cart360List,
      context: {
        limit: postsPerPage,
        skip: i * postsPerPage,
        numCart360Pages,
        currentPage: i + 1,
      },
    })
  })
}

exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions
  if (node.internal.type === `MarkdownRemark`) {
    const slug = createFilePath({ node, getNode, basePath: `pages` })
    createNodeField({
      node,
      name: `slug`,
      value: slug,
    })
  }
}
