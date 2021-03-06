const { DateTime } = require("luxon");
const CleanCSS = require("clean-css");
const UglifyJS = require("uglify-es");

const pluginRss = require("@11ty/eleventy-plugin-rss");

const now = new Date();

module.exports = (eleventyConfig) => {
  eleventyConfig.setBrowserSyncConfig({
    notify: true,
  });

  // Add plugin
  eleventyConfig.addPlugin(pluginRss);

  // Add profile collection so that we can access this outside of homepage
  // TODO Surely there is a better way to do this? Possible to create a data file that pulls from home.md?
  eleventyConfig.addCollection("profile", (collection) => {
    return collection.getAll().filter((item) => {
      return item.data.section == "home";
    });
  });

  // Add excerpts
  eleventyConfig.setFrontMatterParsingOptions({
    excerpt: true,
    excerpt_separator: "<!-- more -->",
  });

  // Minify CSS
  eleventyConfig.addFilter("cssmin", (code) => {
    return new CleanCSS({}).minify(code).styles;
  });

  // Minify JS
  eleventyConfig.addFilter("jsmin", (code) => {
    let minified = UglifyJS.minify(code);
    if (minified.error) {
      console.log("UglifyJS error: ", minified.error);
      return code;
    }
    return minified.code;
  });

  // Date formatting
  eleventyConfig.addFilter("machineDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat("yyyy-MM-dd");
  });
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat("dd LLL yyyy");
  });
  eleventyConfig.addFilter("activityDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat("MM.yyyy");
  });
  eleventyConfig.addFilter("activityYear", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat("yyyy");
  });

  eleventyConfig.addFilter("cleanUrl", (url) => {
    return url.replace(/^(https?:|)\/\//, "");
  });

  // Create Posts collection
  eleventyConfig.addCollection("posts", (collection) => {
    const livePosts = (p) => p.date <= now;
    return collection
      .getFilteredByGlob("./src/posts/*.md")
      .filter(livePosts)
      .reverse();
  });

  // Create activityCurrent collection
  eleventyConfig.addCollection("activityCurrent", (collection) => {
    return collection
      .getFilteredByGlob("./src/activity/*.md")
      .filter((item) => {
        return item.data.dateEnd >= now;
      })
      .reverse();
  });

  // Create activityPast collection
  eleventyConfig.addCollection("activityPast", (collection) => {
    return collection
      .getFilteredByGlob("./src/activity/*.md")
      .filter((item) => {
        return item.data.dateEnd < now;
      })
      .reverse();
  });

  // Markdown
  let markdownIt = require("markdown-it");
  let options = {
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
  };
  eleventyConfig.setLibrary("md", markdownIt(options));
  eleventyConfig.addNunjucksFilter("markdownify", (markdownString) =>
    markdownIt(options).render(markdownString)
  );

  // Copy the fonts
  eleventyConfig.addPassthroughCopy({ "src/_includes/assets/fonts": "fonts" });

  // Copy the favicon contents
  eleventyConfig.addPassthroughCopy({ "src/_includes/assets/favicon": "/" });

  return {
    templateFormats: ["md", "njk", "html", "liquid", "woff", "woff2"],

    pathPrefix: "/",

    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    // passthroughFileCopy: true,
    dir: {
      input: "src/.",
      includes: "_includes",
      data: "_data",
      output: "_dist",
    },
  };
};
