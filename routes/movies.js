// Defines API endpoints for CRUD ops

const express = require("express");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const router = express.Router();
const dataFile = path.join(__dirname, "../data/movies.json");

const readMovies = () => {
    try{
        const data = fs.readFileSync(dataFile, "utf-8");
        return JSON.parse(data);
    } catch (err){
        console.error("Error reading movie data:", err);
        return[];
    }
};

const writeMovies = (movies) => {
    try {
        fs.writeFileSync(dataFile, JSON.stringify(movies, null, 2), "utf-8");
        console.log("Movies written to file successfully");
    } catch (err) {
        console.error("Error writing movies:", err);
    }
};

router.get("/search", async (req, res) => {
    const query = req.query.q;
    if(!query){
        return res.status(400).json({ error: "Search query is required" });
    }

    try { 
        const response = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        if(data.results) { 
            res.json(data.results.map(movie => ({
                tmdb_id: movie.id,
                title: movie.title,
                year: movie.release_date ? movie.release_date.split("-")[0] : null,
                poster_path: movie.poster_path,
                overview: movie.overview
            })));
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error("Error searching TMDb:", error);
        res.status(500).json({ error: "Failed to search movies" });
    }
});


router.post("/", (req, res) => {
    const movies = readMovies();
    const { tmdb_id, title, year, poster_path, overview } = req.body;

    if (!title || !year) {
        return res.status(400).json({ error: "Title and Year are required." });
    }

    const newMovie = {
        id: movies.length + 1,
        tmdb_id: tmdb_id || null,
        title,
        year,
        poster_path: poster_path || null,
        overview: overview || "",
        watched: false,
        rating: null,
        review: ""
    };

    movies.push(newMovie);
    writeMovies(movies);

    res.status(201).json(newMovie);
});

// Update movie rating, review or other fields
router.put("/:id", (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    console.log(`Received update request for movie ID: ${id}`);
    console.log("Update data:", updates);

    let movies = readMovies();
    let movieIndex = movies.findIndex(movie => movie.id == id);

    if (movieIndex === -1) {
        console.log("Movie not found.");
        return res.status(404).json({ error: "Movie not found." });
    }

    try {
        movies[movieIndex] = { ...movies[movieIndex], ...updates };
        writeMovies(movies);
        console.log("Updated movie:", movies[movieIndex]);
        res.json(movies[movieIndex]);
    } catch (error) {
        console.error("Error updating movie:", error);
        res.status(500).json({ error: "Failed to update movie." });
    }
});

// Mark as watched
router.put("/:id/watched", (req, res) => {
    const movieId = parseInt(req.params.id);
    let movies = readMovies();

    const movie = movies.find(m => m.id === movieId);
    if (!movie) {
        return res.status(404).json({ error: "Movie not found" });
    }

    movie.watched = true;
    writeMovies(movies);
    res.json({ message: "Movie marked as watched", movie });
});

// Submit rating and review
router.put("/:id/review", (req, res) => {
    const movieId = parseInt(req.params.id);
    const { rating, review } = req.body;
    let movies = readMovies();

    const movie = movies.find(m => m.id === movieId);
    if (!movie) {
        return res.status(404).json({ error: "Movie not found" });
    }

    movie.rating = rating;
    movie.review = review || "";
    writeMovies(movies);
    res.json(movie);
});

router.delete("/:id", (req, res) => {
    let movies = readMovies();
    const movieId = parseInt(req.params.id);

    const filteredMovies = movies.filter((m) => m.id !== movieId);
    if (filteredMovies.length === movies.length) {
        return res.status(404).json({ error: "Movies not found."});
    }

    writeMovies(filteredMovies);
    res.status(204).send();
});

module.exports = router;
module.exports.readMovies = readMovies;