//Client side js. Handles client side interactions with api.

let searchTimeout;

document.getElementById("search").addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    if (query.length < 2) {
        document.getElementById("search-results").innerHTML = "";
        return;
    }

    searchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`/movies/search?q=${encodeURIComponent(query)}`);
            const movies = await response.json();
            const resultsDiv = document.getElementById("search-results");
            resultsDiv.innerHTML = "";

            if (movies.length === 0) {
                resultsDiv.innerHTML = "<p>No results found.</p>";
                return;
            }

            movies.forEach((movie, index) => {
                const movieDiv = document.createElement("div");
                movieDiv.className = "search-result";
                const sanitizedOverview = movie.overview ? movie.overview.replace(/'/g, "\\'").replace(/"/g, '\\"') : "No overview available.";
                movieDiv.innerHTML = `
                    <div class="search-result-content">
                        ${movie.poster_path ? `<img src="https://image.tmdb.org/t/p/w92${movie.poster_path}" alt="${movie.title} poster" class="search-poster" />` : ""}
                        <div class="search-details">
                            <strong>${movie.title} (${movie.year || "N/A"})</strong>
                            <p>${sanitizedOverview.substring(0, 100)}${sanitizedOverview.length > 100 ? "..." : ""}</p>
                            <button data-movie-id="${index}" class="add-movie-btn">Add to Watchlist</button>
                        </div>
                    </div>
                `;
                resultsDiv.appendChild(movieDiv);
            });

            document.querySelectorAll(".add-movie-btn").forEach(button => {
                button.addEventListener("click", () => {
                    const movieIndex = button.getAttribute("data-movie-id");
                    addMovie(movies[movieIndex]);
                });
            });
        } catch (error) {
            console.error("Error searching movies:", error);
            document.getElementById("search-results").innerHTML = "<p>Error searching movies.</p>";
        }
    }, 300);
});


async function addMovie(movie) {
    const submitButton = document.querySelector("#search-results button");
    if (submitButton) submitButton.disabled = true;

    try {
        const response = await fetch("/movies", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                tmdb_id: movie.tmdb_id || null,
                title: movie.title,
                year: movie.year || null,
                poster_path: movie.poster_path || null,
                overview: movie.overview || ""
            }),
        });

        if (response.ok) {
            window.location.reload();
        } else {
            alert("Failed to add movie");
        }
    } catch (error) {
        console.error("Error adding movie:", error);
        alert("Error adding movie. Please try again.");
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}

async function markWatched(id) {
    try {
        const response = await fetch(`/movies/${id}/watched`, { 
            method: "PUT",
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ watched: true })
        });

        if (response.ok) {
            location.reload();
        } else {
            console.error("Failed to mark movie as watched");
            alert("Failed to mark movie as watched");
        }
    } catch(error) { 
        console.error("Error marking movie as watched:", error);
        alert("Error marking movie as watched");
    }    
}

async function deleteMovie(id) {
    console.log("Attempting to delete movie with ID:", id);

    try {
        const response = await fetch(`/movies/${id}`, { method: "DELETE" });

        if (response.ok) {
            console.log("Movie deleted successfully");
            window.location.reload();
        } else {
            console.error("Failed to delete movie");
            alert("Failed to delete movie");
        }
    } catch (error) {
        console.error("Error deleting movie:", error);
        alert("Error deleting movie");
    }
}

async function submitRating(id) {
    const rating = document.getElementById(`rating-${id}`).value;
    const review = document.getElementById(`review-${id}`).value;

    if (!rating || rating < 1 || rating > 5) {
        return alert("Please enter a rating between 1 and 5");
    }

    try {
        const response = await fetch(`/movies/${id}/review`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rating, review })
        });

        if (response.ok) {
            window.location.reload();
        } else {
            alert("Failed to submit rating/review");
        }
    } catch (error) {
        console.error("Error submitting rating/review:", error);
        alert("Error submitting rating/review");
    }
}

async function updateStatus(statusType, id, checked) {
    try {
        const response = await fetch(`/movies/${id}/${statusType}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [statusType]: checked })
        });

        if (response.ok) {
            if (statusType === "watchlist" && checked) {
                // If adding to watchlist, ensure watched is false
                await fetch(`/movies/${id}/watched`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ watched: false })
                });
            } else if (statusType === "watched" && checked) {
                // If marking as watched, ensure watchlist is false
                await fetch(`/movies/${id}/watchlist`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ watchlist: false })
                });
            }
            window.location.reload();
        } else {
            console.error(`Failed to update ${statusType} status`);
            alert(`Failed to update ${statusType} status`);
        }
    } catch (error) {
        console.error(`Error updating ${statusType} status:`, error);
        alert(`Error updating ${statusType} status`);
    }
}
