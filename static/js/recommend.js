const search_btn = $('.btn-search');
const ul = $('.suggestions-ul');
let title = '';
let title_arr;

$.ajax({
  type: 'GET',
  url: '/grs',
  success: function (titles) {
    title_arr = titles;
  }
})

$('#movie-search').on('keydown', function () {
  title = $(this).val();

  if (title.length > 1) {
    search_btn.attr('disabled', false).removeClass('disabled');
    let empty_array = title_arr.filter(data => data.toLocaleLowerCase().includes($(this).val().toLocaleLowerCase()));
    empty_array = empty_array.map(data => `<li title="${data}" onclick="recommendcard(this)"><i class="bi bi-search"></i><span>${data}</span></li>`);

    empty_array.forEach(function (span) {

    })

    html = '';
    let i = 0;
    if (empty_array.length > 5) {
      while (i < 5) {
        html += empty_array[i]
        i++;
      }
    } else {
      while (empty_array.length != i) {
        html += empty_array[i]
        i++;
      }
    }

    if (html != '') {
      ul.css('display', 'block').html(html);
    } else {
      ul.html('<p style="text-align: center;">Sorry! no such movie is available</p>');
    }
  } else {
    search_btn.attr('disabled', true).addClass('disabled');
    ul.css('display', 'none');
  }
})

function matching(txt) {
  text = txt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let pattern = new RegExp(`${text}`, "gi");
  let lis = document.querySelectorAll('.suggestions-ul li span');
  lis.forEach(function (span) {
    span.innerHTML = span.textContent.replace(pattern, match => `<mf>${match}</mf>`);
  })
}

if (!search_btn.hasClass('disabled')) {
  $('.search-entities').on('submit', function (event) {
    event.preventDefault();
    const my_api_key = '4d2cca396cb3e1aff2e8887d00b673bd';
    load_details(my_api_key, title);
  })
}
search_btn.click(function (event) {
  event.preventDefault();
  const my_api_key = '4d2cca396cb3e1aff2e8887d00b673bd';
  load_details(my_api_key, title);
})

// will be invoked when clicking on the recommended movies
const recommendcard = (e) => {
  var my_api_key = '4d2cca396cb3e1aff2e8887d00b673bd';
  var title = e.getAttribute('title');
  load_details(my_api_key, title);
}

// // get the basic details of the movie from the API (based on the name of the movie)
function load_details(my_api_key, title) {
  $.ajax({
    type: 'GET',
    url: 'https://api.themoviedb.org/3/search/movie?api_key=' + my_api_key + '&query=' + title,

    success: function (movie) {
      if (movie.results.length < 1) {
        $(".loading-spin").delay(500).fadeOut();
        $('.result').css('display', 'none');
        $('.fail').addClass('show');
        setTimeout(() => {
          $('.fail').removeClass('show');
        }, 5000);
      }
      else {
        $(".loading-spin").fadeIn();
        $('.fail').removeClass('show');
        $('.result').css('display', 'block');
        var movie_id = movie.results[0].id;
        var movie_title = movie.results[0].original_title;
        movie_recs(movie_title, movie_id, my_api_key);
      }
    },
    error: function () {
      $('.fail').html('Connection Lost or API error').addClass('show');
      setTimeout(() => {
        $('.fail').html('<span><strong>Sorry</strong> The movie you requested is not in our database. Please check the spelling or try with some other movies</span>').removeClass('show');
      }, 6000);
      $(".loading-spin").delay(200).fadeOut();
    },
  });
}

// // passing the movie name to get the similar movies from python's flask
function movie_recs(movie_title, movie_id, my_api_key) {
  $.ajax({
    type: 'POST',
    url: "/similarity",
    data: { 'name': movie_title },
    success: function (recs) {
      const err = "Sorry! The movie you requested is not in our database. Please check the spelling or try with some other movies";
      (recs == err) ? found = false : found = true;
      if (found) {
        $('.fail').removeClass('show');
        $('.result').css('display', 'block');
        var movie_arr = recs.split('---');
        var arr = [];
        for (const movie in movie_arr) {
          arr.push(movie_arr[movie]);
        }
        get_movie_details(movie_id, my_api_key, arr, movie_title);
      } else {
        $(".loading-spin").delay(500).fadeOut();
        $('.result').css('display', 'none');
        $('.fail').addClass('show');
        setTimeout(() => {
          $('.fail').removeClass('show');
        }, 5000);
      }
    },
    error: function () {
      $('.fail').addClass('show');
      setTimeout(() => {
        $('.fail').removeClass('show');
      }, 5000);
      $(".loading-spin").delay(500).fadeOut();
    },
  });
}

// get all the details of the movie using the movie id.
function get_movie_details(movie_id, my_api_key, arr, movie_title) {
  $.ajax({
    type: 'GET',
    url: 'https://api.themoviedb.org/3/movie/' + movie_id + '?api_key=' + my_api_key,
    success: function (movie_details) {
      show_details(movie_details, arr, movie_title, my_api_key, movie_id);
    },
    error: function () {
      alert("API Error!");
      $(".loading-spin").delay(500).fadeOut();
    },
  });
}

// passing all the details to python's flask for displaying and scraping the movie reviews using imdb id
function show_details(movie_details, arr, movie_title, my_api_key, movie_id) {
  var poster = 'https://image.tmdb.org/t/p/original' + movie_details.poster_path;
  var overview = movie_details.overview;
  var genres = movie_details.genres;
  var rating = movie_details.vote_average;
  var vote_count = movie_details.vote_count;
  var release_date = new Date(movie_details.release_date);
  var runtime = parseInt(movie_details.runtime);
  var status = movie_details.status;

  var genre_list = []

  for (var genre in genres) {
    genre_list.push(genres[genre].name);
  }

  var my_genre = genre_list.join(", ");
  if (runtime % 60 == 0) {
    runtime = Math.floor(runtime / 60) + " hour(s)"
  }
  else {
    runtime = Math.floor(runtime / 60) + " hour(s) " + (runtime % 60) + " min(s)"
  }

  arr_poster = get_movie_posters(arr, my_api_key); // Yet to review this one line

  details = {
    'title': movie_title,
    'poster': poster,
    'genres': my_genre,
    'overview': overview,
    'rating': rating,
    'vote_count': vote_count.toLocaleString(),
    'release_date': release_date.toDateString().split(' ').slice(1).join(' '),
    'runtime': runtime,
    'status': status,
    'rec_movies': JSON.stringify(arr),
    'rec_posters': JSON.stringify(arr_poster),
  }
  $.ajax({
    type: 'POST',
    data: details,
    url: "/recommend",
    dataType: 'html',
    complete: function () {
      $(".loading-spin").delay(500).fadeOut();
      ul.css('display', 'none')
    },
    success: function (response) {
      $('.result').html(response);
      search_btn.attr('disabled', true).addClass('disabled');
      $('#movie-search').val('');
      height = $('.search-menu').outerHeight();
      $(window).scrollTop(height);
    }
  });
}

// getting posters for all the recommended movies
function get_movie_posters(arr, my_api_key) {
  var arr_poster_list = []
  for (var m in arr) {
    $.ajax({
      type: 'GET',
      url: 'https://api.themoviedb.org/3/search/movie?api_key=' + my_api_key + '&query=' + arr[m],
      async: false,
      success: function (m_data) {
        arr_poster_list.push('https://image.tmdb.org/t/p/original' + m_data.results[0].poster_path);
      },
      error: function () {
        alert("Invalid Request!");
        $(".loading-spin").delay(500).fadeOut();
      },
    })
  }
  return arr_poster_list;
}