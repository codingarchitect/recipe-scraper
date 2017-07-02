const express = require('express');
const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');
const app     = express();

const parseString = require('xml2js').parseString;

app.get('/scrape', function(req, res){
  console.log('scrape');
  const filename = 'sitemap.xml';
  fs.readFile(filename, 'utf8', function(err, data) {
    if (err) throw err;
    console.log('OK: ' + filename);
    parseString(data, function (err, result) {
      const numberOfEntriesToProcess = 10;
      entries = result.feed.entry.slice(0, numberOfEntriesToProcess);
      let recipeMetadata = [];
      let i = 1;
      entries.forEach((entry) => {
        const links = entry.link;
        const link = links.find(link => link.$.rel === 'alternate');
        const recipe = {
          title: link.$.title,
          url: link.$.href
        };
        request(recipe.url, function(error, response, html){
          if(!error) {
            var $ = cheerio.load(html);
            const recipeCard = $('div[itemtype="http://schema.org/Recipe"]').html();
            const recipeMetadatum = scrapeRecipe($, recipeCard);
            recipeMetadata.push(recipeMetadatum);
            i++;
            if (i === numberOfEntriesToProcess) {
              fs.writeFile("recipes.json", JSON.stringify(recipeMetadata, null, 2), function(err) {
                if(err) {
                  return console.log(err);
                }
                console.log("recipes.json file was saved!");
              }); 
            }
          } else {
            console.log(error);
          }
        });        
      });      
    });
  });
})

function scrapeRecipe($, recipeCard) {
  const recipeMetadata = {
    name: scrapeName($, recipeCard),
    image: scrapeImage($, recipeCard),
    description: scrapeDescription($, recipeCard),
    keywords: scrapeKeywords($, recipeCard),
    recipeCuisine: scrapeRecipeCuisine($, recipeCard),
    recipeCategory: scrapeRecipeCategory($, recipeCard),
    recipeYield: scrapeRecipeYield($, recipeCard),
    prepTime: scrapePrepTime($, recipeCard),
    cookTime: scrapeCookTime($, recipeCard),
    totalTime: scrapeTotalTime($, recipeCard),
    ingredients: scrapeIngredients($, recipeCard),
    recipeInstructions: scrapeRecipeInstructions($, recipeCard)
  }
  return recipeMetadata;
}
function scrapeName($, recipeCard) {
  const nameEl = $('*[itemprop="name"]', recipeCard).first();
  return nameEl.text();
}
function scrapeImage($, recipeCard) {
  const imageEl = $('*[itemprop="image"]', recipeCard)
  return {
    url: imageEl.attr('src'),
    title: imageEl.attr('title'),
    alt: imageEl.attr('alt'),
  };
}
function scrapeDescription($, recipeCard) {
  const descriptionEl = $('*[itemprop="description"]', recipeCard)
  return descriptionEl.text();
}
function scrapeKeywords($, recipeCard) {
  const keywordsEl = $('*[itemprop="keywords"]', recipeCard)
  return keywordsEl.attr('content');
}
function scrapeRecipeCuisine($, recipeCard) {
  const recipeCuisineEl = $('*[itemprop="recipeCuisine"]', recipeCard)
  return recipeCuisineEl.text();
}
function scrapeRecipeCategory($, recipeCard) {
  const recipeCategoryEl = $('*[itemprop="recipeCategory"]', recipeCard)
  return recipeCategoryEl.text();
}
function scrapeRecipeYield($, recipeCard) {
  const recipeYieldEl = $('*[itemprop="recipeYield"]', recipeCard)
  return recipeYieldEl.text();
}
function scrapePrepTime($, recipeCard) {
  const prepTimeEl = $('*[itemprop="prepTime"]', recipeCard)
  return {
    content: prepTimeEl.attr('content'),
    text: prepTimeEl.text()
  };
}
function scrapeCookTime($, recipeCard) {
  const cookTimeEl = $('*[itemprop="cookTime"]', recipeCard)
  return {
    content: cookTimeEl.attr('content'),
    text: cookTimeEl.text()
  };
}
function scrapeTotalTime($, recipeCard) {
  const totalTimeEl = $('*[itemprop="totalTime"]', recipeCard)
  return {
    content: totalTimeEl.attr('content'),
    text: totalTimeEl.text()
  };
}
function scrapeIngredients($, recipeCard) {
  let ingredients = [];
  $('*[itemprop="ingredients"]', recipeCard).toArray().forEach(ingredient => {
    let ingredientEl = $(ingredient);
    if (ingredientEl.text) 
      ingredients.push(ingredientEl.text());
    else 
      ingredients.push(ingredientEl);    
  });
  return ingredients;
}
function scrapeRecipeInstructions($, recipeCard) {
  let instructions = [];
  $('*[itemprop="recipeInstructions"]', recipeCard).toArray().forEach(instruction => {
    let instructionEl = $(instruction);
    if (instructionEl.text) 
      instructions.push({
        text: instructionEl.text(),
        html: instructionEl.html()
      });
    else 
      instructions.push(instructionEl);
  });
  return instructions;
}

app.listen('8081')

console.log('Magic happens on port 8081');

exports = module.exports = app;
