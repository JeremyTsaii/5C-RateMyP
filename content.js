//Overview of content script:
//First, keep track of all the course boxes and inject the button into whichever course is clicked on.
//Update the list of course boxes whenever the user types into the search box or adds/removes a course.
//Upon click of injected button, get the professor's name and the campus.
//If the professor is already within the storage dictionary, display the div that is stored using the
//professor's name as the key.
//If not in dictionary, use professor name and campus to get the url of the search 
//and make a request to find the teacher id.
//Next, get the url of the statistics page using the teacher id and make a request to get the ratings.
//Finally, insert the gained ratings into the popup that appears when users click on the injected button.
//Store the div containing the ratings and graphics pertaining to the professor in the storage dictionary
//using the professor's name as the key. 

//sends message to background script to activate extension icon
chrome.runtime.sendMessage({type:'showPageAction'});
console.log("RMP extension activated.");

//create/clear storage dictionary for professors on every refresh
var storage_dict = {};
console.log('Empty storage dictionary created.')

//load css 
var head = document.getElementsByTagName('HEAD')[0];  
var link = document.createElement('link'); 
link.rel = 'stylesheet';  
link.type = 'text/css'; 
link.href = 'main.css'; 
head.appendChild(link); 

///////////////////////////////////////////////////////////////////////////////////////////////////////
//--------------------------------------Event Listeners------------------------------------------------
///////////////////////////////////////////////////////////////////////////////////////////////////////

//indicates whether popup box is already open
//default is false, change to true when rmp button is clicked, change back to false after another click
var popup_open = false 

//inject button when course is clicked on
//listen for clicks on courses in the course search div
var course_search = document.getElementById('course-search-results-list');
course_search.addEventListener('click', function(e) {
    if ((e.target && e.target.className == 'course-box-text' || e.target.className == 'course-box-course-code' || e.target.className == 'course-box-content')) {
        inject_cell();
        if(popup_open) {
            popup_open = false;
            console.log('Popup box closed.')
        }
    }
});
//listen for clicks on courses in the chosen course list div
var selected_courses = document.getElementById('selected-courses-list');
selected_courses.addEventListener('click', function(e) {
    if ((e.target && e.target.className == 'course-box-text' || e.target.className == 'course-box-course-code' || e.target.className == 'course-box-content')) {
        inject_cell();
        if(popup_open) {
            popup_open = false;
            console.log('Popup box closed.')
        }
    }
});
//listen for clicks on courses in schedule table div
var table = document.getElementById('schedule-table');
table.addEventListener('click', function(e) {
    if ((e.target && e.target.className == 'schedule-slot-course-name' || e.target.className == 'schedule-slot-course-code' || e.target.className == 'schedule-slot' || e.target.className == 'schedule-slot-text-wrapper')) {
        inject_cell();
        if(popup_open) {
            popup_open = false;
            console.log('Popup box closed.')
        }
    }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////
//--------------------------------------Main Functions-------------------------------------------------
///////////////////////////////////////////////////////////////////////////////////////////////////////

//function to inject button at the top of information box
function inject_cell(){
    //button
    var button = document.createElement('BUTTON');
    button.innerHTML = '5C RateMyP';
    button.id = 'rmp-button';

    //popup container and text
    var container = document.createElement('div');
    container.className = 'popup';
    container.id = 'popup_box';
    create_popup(container);
    
    //injection        
    var description_box = document.getElementById('course-description-box');
    description_box.prepend(container);
    description_box.prepend(document.createElement('hr'));
    description_box.prepend(button);
    console.log('Button injected.');
    
    //in case of course description text overflow due to button injection
    var description_container = document.getElementById('course-description-box-outer')
    description_container.style.height = 'auto';

    //open popup on button click 
    document.getElementById('rmp-button').addEventListener('click', open_box);
}

//creates the div elements in the popup box and appends to inputted container div
function create_popup(container) {
    var popup_title = document.createElement('div');
    popup_title.id = 'popup_title';
    popup_title.className = 'popuptext';
    container.appendChild(popup_title);

    var popup_overall = document.createElement('div');
    popup_overall.id = 'popup_overall';
    popup_overall.className = 'popuptext';
    container.appendChild(popup_overall);

    var overall_graphic = document.createElement('div');
    overall_graphic.id = 'overall_graphic';
    overall_graphic.className = 'popuptext';
    container.appendChild(overall_graphic);

    var popup_difficulty = document.createElement('div');
    popup_difficulty.id = 'popup_difficulty';
    popup_difficulty.className = 'popuptext';
    container.appendChild(popup_difficulty);

    var difficulty_graphic = document.createElement('div');
    difficulty_graphic.id = 'difficulty_graphic';
    difficulty_graphic.className = 'popuptext';
    container.appendChild(difficulty_graphic);

    var popup_again = document.createElement('div');
    popup_again.id = 'popup_again';
    popup_again.className = 'popuptext';
    popup_again.style.textAlign = 'center';
    popup_again.innerText = 'Loading... (~3 Seconds)';
    container.appendChild(popup_again);

    var again_graphic = document.createElement('div');
    again_graphic.id = 'again_graphic';
    again_graphic.className = 'popuptext';
    container.appendChild(again_graphic);

    var popup_tags = document.createElement('div');
    popup_tags.id = 'popup_tags';
    popup_tags.className = 'popuptext';
    container.appendChild(popup_tags);

    var popup_num = document.createElement('div');
    popup_num.id = 'popup_num';
    popup_num.className = 'popuptext';
    container.appendChild(popup_num);

    var popup_link = document.createElement('div');
    popup_link.id = 'popup_link';
    popup_link.className = 'popuptext';
    container.appendChild(popup_link);
}

//obtains professor and class information 
function get_description() {
    //get information from description box on hyperschedule
    var description_box = document.getElementById('course-description-box');
    var rows = description_box.children.length;
    var class_info = description_box.firstChild.nextSibling.nextSibling.nextSibling;
    var course_code = class_info.innerText.split(' ')[0];
    var campus_initial = class_info.innerText.split(' ')[2].slice(0,2);
    var prof_name = class_info.nextSibling.nextSibling.nextSibling.nextSibling;
    var campus_name = '';

    //if PE class, do not get information from RMP
    if (course_code == 'PE') {
        document.getElementById('popup_again').style.textAlign = 'center';
        document.getElementById('popup_again').innerText = 'This is a P.E. class! No results from RMP.';
        return;
    }
    //set campus name according to campus initials found in course
    if (campus_initial == 'PO') {
        campus_name = 'Pomona+College';
        campus_initial = 'Pomona College';
    }
    else if (campus_initial == 'HM') {
        campus_name = 'Harvey+Mudd+College';
        campus_initial = 'Harvey Mudd College';
    }
    else if (campus_initial == 'PZ') {
        campus_name = 'Pitzer+College';
        campus_initial = 'Pitzer College';
    }
    else if (campus_initial == 'SC') {
        campus_name = 'Scripps+College';
        campus_initial = 'Scripps College';
    }
    else if (campus_initial == 'CM') {
        campus_name = 'Claremont+McKenna+College'
        campus_initial = 'Claremont McKenna College';
    }
    
    //case with extra rows in description box due to multiple meeting locations/times (rows usually 12)
    if (rows == 16) {
        prof_name = prof_name.nextSibling.nextSibling;
    }
    else if (rows == 18) {
        prof_name = prof_name.nextSibling.nextSibling.nextSibling.nextSibling;
    }
    else if (rows == 20) {
        prof_name = prof_name.nextSibling.nextSibling.nextSibling.nextSibling.nextSibling.nextSibling;
    }

    //check if prof name is staff 
    if (prof_name.innerText == 'Staff') {
        var message = 'This is a course taught by Staff so there are no reviews.';
        document.getElementById('popup_again').style.textAlign = 'center';
        document.getElementById('popup_again').innerText = message;
        return;
    }
    console.log(class_info.innerText);
    console.log(prof_name.innerText);

    //format and display professor information
    var popup_title = document.getElementById('popup_title');
    var names_initial = prof_name.innerText.split(' and ').join(',').split(',');
    var names_formatted = [];
    var prof1 = ''; 
    var prof2 = ''; //future implementation with classes having multiple professors 
    var prof3 = ''; //currently only retrieve ratings of the first professor listed 
    names_formatted.push(names_initial[1].trim().split(' ')[0]);
    names_formatted.push(names_initial[0].trim());
    prof1 = "Prof. " + names_formatted[0] + ' ' + names_formatted[1];

    //if prof_name already within storage_dict, take from Chrome.Storage and override current popup
    console.log('Checking storage for ' + prof1 + '.');
    if (prof1 in storage_dict) {
        //remove current popup
        var old_child = document.getElementById('popup_box');
        old_child.parentNode.removeChild(old_child);
        //append retrieved popup into correct position
        var new_child = storage_dict[prof1];
        var anchor = document.getElementById('rmp-button').nextSibling.nextSibling; //reference point for insertion
        anchor.parentNode.insertBefore(new_child, anchor);
        console.log(prof1 + ' found and retrieved from storage.');
        }
    //if prof_name not in storage, gather information from rmp search page using professor and campus name
    else {
        console.log(prof1 + ' not found in storage.')
        var teacher_name = names_formatted[0] + '+' + names_formatted[1]; //search query for teacher name
        var search_url = 'https://cors-anywhere.herokuapp.com/http://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&schoolName=' + campus_name + '&queryoption=HEADER&query=' + teacher_name + '&facetSearch=true';
        get_search(search_url, prof1, campus_initial);
    }
}

//check if professor has page and ratings on rmp using request
function get_search(search_url, prof1, campus_initial) {
    var proxy_url = 'https://cors-anywhere.herokuapp.com/'
    var page_url = 'https://www.ratemyprofessors.com' //before appending teacher id
    var search_request = new XMLHttpRequest();
	search_request.onreadystatechange = function(){
		if (search_request.readyState == 4 && search_request.status == 200){
            //insert response.text into a div so we can search for elements within
            var search_div = document.createElement('div');
            search_div.innerHTML = search_request.responseText;
            var prof_list = search_div.getElementsByClassName('listing PROFESSOR');

            //case where no professor found
            if (prof_list.length==0) {
                var message = 'Sorry, there does not appear to be a ' + prof1 + ' at ' + campus_initial + ' within RMP.';
                document.getElementById('popup_again').style.textAlign = 'center';
                document.getElementById('popup_again').innerText = message;
                document.getElementById('popup_title').innerText = 'No Results Found.'
                console.log('Professor not found on RMP.');

                //add popup div to storage_dict
                storage_dict[prof1] = document.getElementById('popup_box');
                console.log(prof1 + ' added to storage.');
            }
            //take the first professor in search results 
            else{
                var prof_id = prof_list[0].getElementsByTagName('a')[0].getAttribute('href');
                user_url = page_url+prof_id
                page_url = proxy_url + user_url;
                setTimeout( function() {get_prof(page_url, user_url, prof1, campus_initial);}, 1000);
                console.log('Professor found on RMP.')
            }
		}
    }
    search_request.open("GET", search_url, true);
    search_request.send();
}

//attain ratings/reviews from rmp using request
function get_prof(page_url, user_url, prof1, campus_initial) {
    var prof_request = new XMLHttpRequest();
	prof_request.onreadystatechange = function(){
		if (prof_request.readyState == 4 && prof_request.status == 200){
            //insert response.text into a div so we can search for elements within
            var prof_div = document.createElement('div');
            prof_div.innerHTML = prof_request.responseText;

            //case where professor has a page but it has no ratings
            var check_empty = prof_div.getElementsByClassName('headline');
            if (check_empty.length>0) {
                var message = 'It appears ' + prof1 + ' at ' + campus_initial + ' has a page within RMP but has no reviews yet.';
                document.getElementById('popup_again').style.textAlign = 'center';
                document.getElementById('popup_again').innerText = message;
            }
            //professor has a page with ratings
            else {
                var ratings = prof_div.getElementsByClassName('grade');
                var num_ratings = prof_div.getElementsByClassName('table-toggle rating-count active');
                var tag_list = prof_div.getElementsByClassName('tag-box-choosetags');
    
                //format ratings
                var overall = 'Overall Rating: ' + ratings[0].innerText.trim() + '/5.0';
                var again = 'Take-Again Percentage: ' + ratings[1].innerText.trim();
                var difficulty = 'Difficulty: ' + ratings[2].innerText.trim() + '/5.0';
                var num = num_ratings[0].innerText.trim();
                var tags = 'No tags available.';
                if (tag_list.length >= 1) {
                    tags = 'Top Tag: ' + tag_list[0].innerText;
                }
                
                //append link to popup_link div
                var anchor = document.createElement('a');
                anchor.id = 'anchor_link';
                anchor.target = '_blank';
                anchor.rel = 'noopener noreferrer';
                anchor.href = user_url;
                document.getElementById('popup_link').appendChild(anchor);
                
                //insert ratings into popup
                document.getElementById('popup_title').innerText = prof1 + ':';
                document.getElementById('popup_overall').innerText = overall;
                document.getElementById('popup_difficulty').innerText = difficulty;
                document.getElementById('popup_again').style.textAlign = 'left';
                document.getElementById('popup_again').innerText = again;
                document.getElementById('popup_tags').innerText = tags;
                document.getElementById('popup_num').innerText = num;
                document.getElementById('anchor_link').innerText = 'Click for full RMP ratings.';
    
                //change popup backgrounds for graphic and link rows
                change_backgrounds();
    
                //change the percent bar color according to inputted ratings
                update_graphics(ratings[0].innerText.trim(), ratings[2].innerText.trim(), ratings[1].innerText.trim());
    
                //add popup div to storage_dict
                storage_dict[prof1] = document.getElementById('popup_box');
                console.log(prof1 + ' added to storage.'); 
            }
                                                       
		}
    }
    prof_request.open("GET", page_url, true);
    prof_request.send();
}

//change the percent bar color according to inputted ratings
function update_graphics(overall, difficulty, again) {
    var overall_bar = document.createElement('div');
    var overall_percent = String(parseFloat(overall)/5 * 100) + '%';
    overall_bar.id = 'overall_bar';
    overall_bar.innerText = overall;
    overall_bar.style.width = overall_percent;
    color(overall_bar, 'normal');
    document.getElementById('overall_graphic').appendChild(overall_bar);

    var difficulty_bar = document.createElement('div');
    var difficulty_percent = String(parseFloat(difficulty)/5 * 100) + '%';
    difficulty_bar.id = 'difficulty_bar';
    difficulty_bar.innerText = difficulty;
    difficulty_bar.style.width = difficulty_percent;
    color(difficulty_bar, 'inverse');
    document.getElementById('difficulty_graphic').appendChild(difficulty_bar);

    var again_bar = document.createElement('div');
    var again_percent = again;
    again_bar.id = 'again_bar';
    //case where there is an actual percent 
    if (again != 'N/A') {
        again_bar.innerText = again;
        again_bar.style.width = again;
        color(again_bar, 'normal');
    }
    document.getElementById('again_graphic').appendChild(again_bar);
}

//changes color of bar to green/yellow/orange/red according to the percentage
//takes in second argument called type ('normal' if for overall or again, 'inverse' if for difficulty)
function color(bar, type) {
    var percent = Number(bar.style.width.substring(0, bar.style.width.length-1));
    if (type == 'normal'){
        if (percent>=80) {
            bar.style.backgroundColor = '#1BFF70';
        }
        else if (percent>=60) {
            bar.style.backgroundColor = '#DAFF1B';
        }
        else if (percent>=40) {
            bar.style.backgroundColor = '#FF901B';
        }
        else {
            bar.style.backgroundColor = '#FF1B1B'
        }
    }
    else if (type == 'inverse') {
        if (percent<=40) {
            bar.style.backgroundColor = '#1BFF70';
        }
        else if (percent<=60){
            bar.style.backgroundColor = '#DAFF1B';
        }
        else if (percent<=80) {
            bar.style.backgroundColor = '#FF901B';
        }
        else {
            bar.style.backgroundColor = '#FF1B1B';
        }
    }
}

//change popup backgrounds for graphic and link rows
function change_backgrounds() {
    document.getElementById('popup_link').style.backgroundColor = 'linear-gradient(rgba(0,0,0,.9), rgba(0,0,0,0.9))';
    document.getElementById('overall_graphic').style.backgroundColor = '#ddd';
    document.getElementById('difficulty_graphic').style.backgroundColor = '#ddd';
    document.getElementById('again_graphic').style.backgroundColor = '#ddd';
}

//opens profesor ratings box
function open_box() {
    if(popup_open) {
        //close popup box
        var popup = document.getElementById('popup_box');
        popup.classList.toggle('show');
        console.log('Popup box closed.');

        //indicate popup is closed
        popup_open = false;
    }
    else {
        //indicate popup is open
        popup_open = true;

        //get information and display
        setTimeout(get_description, 1000);
        console.log('Getting information from description.');

        //open popup box
        var popup = document.getElementById('popup_box');
        popup.classList.toggle('show');
        console.log('Popup box opened.');
    }
}



