import pandas as pd
from flask import Flask, render_template, request
import difflib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def rcmd(user_movie_name):
    movies_data = pd.read_csv('movies.csv')
    selected_features = ["genres", "keywords", 'tagline', "cast", "director"]
    for feature in selected_features:
        movies_data[feature] = movies_data[feature].fillna('')

    combined_features = movies_data['genres']+' '+movies_data['keywords']+' ' +movies_data['tagline']+' '+movies_data['cast'] +' '+movies_data['director']
    vectorizer = TfidfVectorizer()
    feature_vectorizer = vectorizer.fit_transform(combined_features)
    similarity = cosine_similarity(feature_vectorizer)
    list_of_al_titles = movies_data['title'].tolist()
    find_close_match = difflib.get_close_matches(
        user_movie_name, list_of_al_titles)
    close_match = find_close_match[0]
    index_of_movie = movies_data[movies_data.title == close_match]['index'].values[0]
    similarity_scrore = list(enumerate(similarity[index_of_movie]))
    sorted_similar_movies = sorted(similarity_scrore, key=lambda x: x[1], reverse=True)

    top_10_movies_list = []
    for movies in sorted_similar_movies:
        index = movies[0]
        movie_title = movies_data[movies_data.index ==
                                  index]['title'].values[0]
        if (len(top_10_movies_list) != 16):
            top_10_movies_list.append(movie_title)
    return top_10_movies_list

def recommendations():
    movie_titles = pd.read_csv('movies.csv')
    movie_titles = movie_titles['title'].tolist()
    return movie_titles

def convert_to_list(my_list):
    my_list = my_list.split('","')
    my_list[0] = my_list[0].replace('["', '')
    my_list[-1] = my_list[-1].replace('"]', '')
    return my_list

app = Flask(__name__)

@app.route('/grs', methods=['GET','POST'])
def grs():
    titles = recommendations()
    return titles

@app.route('/')
def index():
    titles = recommendations()
    return render_template('index.html', titles=titles)

@app.route("/similarity", methods=['GET', 'POST'])
def similarity():
    movie = request.form['name']
    records = rcmd(movie)
    if type(records) == type('string'):
        return records
    else:
        movies_str = "---".join(records)
        return movies_str

@app.route("/recommend", methods=['GET','POST'])
def recommend():
    title = request.form['title']
    poster = request.form['poster']
    genres = request.form['genres']
    overview = request.form['overview']
    vote_average = request.form['rating']
    vote_count = request.form['vote_count']
    release_date = request.form['release_date']
    runtime = request.form['runtime']
    status = request.form['status']
    rec_movies = request.form['rec_movies']
    rec_posters = request.form['rec_posters']

    rec_movies = convert_to_list(rec_movies)
    rec_posters = convert_to_list(rec_posters)

    movie_cards = {rec_posters[i]: rec_movies[i]
                   for i in range(len(rec_posters))}

    return render_template('recommend.html', title=title, poster=poster, overview=overview, vote_average=vote_average,
                           vote_count=vote_count, release_date=release_date, runtime=runtime, status=status, genres=genres,
                           movie_cards=movie_cards)

if __name__ == '__main__':
    app.run(debug=True) 