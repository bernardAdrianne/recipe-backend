import multer from "multer";
import { supabase } from "../utils/supabaseClient.js";
import Recipe from '../model/recipeModel.js';
import { errorHandler } from "../utils/error.js";
import ollama from "ollama";
import mongoose from "mongoose";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export const addRecipeWithImage = [
  upload.single('image'), 

  async (req, res, next) => {
    try {
      const { title, ingredients, steps, category } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: 'Image file is required' });
      }

      const filename = `${Date.now()}_${req.file.originalname}`;
      const { data, error } = await supabase.storage
        .from('recipe') 
        .upload(filename, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        return next(error);
      }

      const publicUrl = supabase.storage
        .from('recipe')
        .getPublicUrl(filename).data.publicUrl;

      // Save recipe to MongoDB
      const newRecipe = new Recipe({
        title,
        image: publicUrl,
        ingredients: JSON.parse(ingredients),  
        steps: JSON.parse(steps),    
        category,     
      });

      await newRecipe.save();

      res.status(201).json({ message: 'Recipe created', recipe: newRecipe });

    } catch (err) {
      next(err);
    }
  }
];

export const getRecipesByCategory = async (req, res, next) => {
  const { category } = req.query;

  try {
    const query = category && category !== 'All' 
      ? { category } 
      : {};

    const recipes = await Recipe.find(query).sort({ createdAt: -1 });
    res.status(200).json({ results: recipes });
  } catch (err) {
    next(errorHandler(500, 'Failed to fetch recipes by category'));
  }
};

export const searchRecipesAI = async (req, res, next) => {
  const { ingredient } = req.query;
  if (!ingredient) {
    return res.status(400).json({ message: "Ingredient query missing" });
  }

  try {
    const ingredients = ingredient.split(",").map(i => i.trim()).filter(Boolean);

    const regexArray = ingredients.map(i => ({ ingredients: { $regex: new RegExp(i, "i") } }));
    const dbMatches = await Recipe.find({ $and: regexArray });

    if (dbMatches.length === 0) {
      return res.status(404).json({ message: "No recipes found with those ingredients" });
    }

    // Prepare data for AI ranking
    const recipeData = dbMatches.map(r => ({
      id: r._id,
      title: r.title,
      ingredients: r.ingredients,
      category: r.category,
    }));

    const prompt = `
      The user searched for: "${ingredients.join(", ")}".
      Here are possible recipes:
      ${JSON.stringify(recipeData, null, 2)}

      Task:
      - Rank the recipes from most relevant to least relevant.
      - Return ONLY an array of recipe IDs in JSON.
      Example: ["65d8f2...", "65d8f3..."]
    `;

    const response = await ollama.chat({
      model: "mistral:latest",
      messages: [{ role: "user", content: prompt }],
    });

    let matchedIds = [];
    try {
      const rawContent = response.message.content.trim();

      // Extract the first valid JSON array from AI response
      const match = rawContent.match(/\[.*\]/s);
      if (match) {
        matchedIds = JSON.parse(match[0]);
      } else {
        throw new Error("No valid JSON array found in AI response");
      }
    } catch (err) {
      console.warn("AI ranking failed, returning DB matches directly:", err.message);
      return res.status(200).json({ results: dbMatches });
    }

    // Reorder results by AI ranking
    const rankedRecipes = matchedIds
      .map(id => dbMatches.find(r => r._id.toString() === id))
      .filter(Boolean);

    // If AI returned weird IDs, fallback to DB matches
    if (rankedRecipes.length === 0) {
      return res.status(200).json({ results: dbMatches });
    }

    res.status(200).json({ results: rankedRecipes });
  } catch (err) {
    console.error("AI search error:", err);
    next(errorHandler(500, "AI search failed"));
  }
};

export const getAllRecipes = async (req, res, next) => {
   try {
    const recipes = await Recipe.find().sort({ createdAt: -1 });
    res.status(200).json({ results: recipes }); 
   } catch (err) {
    next(errorHandler(500, 'Failed to fetch all recipes.'));
   }
};

export const getRecipe = async (req, res, next) => {
  try {
    const { id } = req.params;
    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return next(errorHandler(404, 'Recipe not found'));
    }

    res.status(200).json({ results: recipe });
  } catch (err) {
    next(errorHandler(500, 'Failed to fetch recipe'));
  }
};