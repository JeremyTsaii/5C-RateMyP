//Overview of content script:
//First, keep track of all the course boxes and inject the button into whichever course is clicked on.
//Update the list of course boxes whenever the user types into the search box or adds/removes a course.
//Upon click of injected button, get the professor's name and the campus.
//Use professor name and campus to get the url of the search and make a request to find the teacher id.
//Lastly, get the url of the statistics page using the teacher id and make a request to get the ratings.
//Finally, insert the gained ratings into the popup that appears when users click on the injected button.

//sends message to background script to activate extension icon
chrome.runtime.sendMessage({type:'showPageAction'});
console.log("RMP extension initialized.");

//load css 
var head = document.getElementsByTagName('HEAD')[0];  
var link = document.createElement('link'); 
link.rel = 'stylesheet';  
link.type = 'text/css'; 
link.href = 'main.css'; 
head.appendChild(link); 

//function to inject button at the top of information box
function inject_cell(){
    //button
    var button = document.createElement('BUTTON');
    button.innerHTML = '5C RateMyP';
    button.id = 'rmp-button';

    //popup container and text
    var container = document.createElement('div');
    container.className = "popup";
    create_popup(container);
    
    //injection        
    var description_box = document.getElementById('course-description-box');
    description_box.prepend(container);
    description_box.prepend(document.createElement('hr'));
    description_box.prepend(button);
    console.log('Button injected.');
    
    //in case of course description text overflow due to button injection
    var description_container = document.getElementById('course-description-box-outer')
    description_container.style.height = "auto";

    //open popup on button click 
    document.getElementById('rmp-button').addEventListener('click', open_box);
}

//creates the span elements in the popup box and appends to inputted container div
function create_popup(container) {
    var popup_title = document.createElement('span');
    popup_title.id = 'popup_title';
    popup_title.className = 'popuptext';
    container.appendChild(popup_title);

    var popup_overall = document.createElement('span');
    popup_overall.id = 'popup_overall';
    popup_overall.className = 'popuptext';
    container.appendChild(popup_overall);

    var popup_difficulty = document.createElement('span');
    popup_difficulty.id = 'popup_difficulty';
    popup_difficulty.className = 'popuptext';
    container.appendChild(popup_difficulty);

    var popup_num = document.createElement('span');
    popup_num.id = 'popup_num';
    popup_num.className = 'popuptext';
    container.appendChild(popup_num);

}

//function for getting professor and class information
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
        document.getElementById('popup_title').innerText = 'This is a P.E. class! No results from RMP.';
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


    //case with extra row in description box due to multiple meeting locations/times (rows usually 12)
    if (rows == 14) {
        prof_name = prof_name.nextSibling.nextSibling;
    }
    console.log(class_info.innerText);
    console.log(prof_name.innerText);

    //format and display professor information
    var popup_title = document.getElementById('popup_title');
    var names_initial = prof_name.innerText.split('and').join(',').split(',');
    var names_formatted = [];
    var prof1 = ''; 
    var prof2 = '';

    //case with two professors listed
    if (names_initial.length == 4) {
        names_formatted.push(names_initial[1].trim().split(' ')[0]); //first prof first name
        names_formatted.push(names_initial[0].trim()); //first prof last name
        names_formatted.push(names_initial[3].trim().split(' ')[0]); //second prof first name
        names_formatted.push(names_initial[2].trim()); //second prof last name
        prof1 = 'Prof. ' + names_formatted[0] + ' ' + names_formatted[1];
        prof2 = 'Prof. ' + names_formatted[2] + ' ' + names_formatted[3];
    }
    //case with one professor listed
    else if (names_initial.length == 2) {
        names_formatted.push(names_initial[1].trim().split(' ')[0]);
        names_formatted.push(names_initial[0].trim());
        prof1 = "Prof. " + names_formatted[0] + ' ' + names_formatted[1];
    }

    //gather information from rmp search page using professor and campus name
    var teacher_name = names_formatted[0] + '+' + names_formatted[1]; //search query for teacher name
    var search_url = 'https://cors-anywhere.herokuapp.com/http://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&schoolName=' + campus_name + '&queryoption=HEADER&query=' + teacher_name + '&facetSearch=true';
    get_search(search_url, prof1, campus_initial);
    
}

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
                document.getElementById('popup_title').innerText = message;
                console.log('Professor not found.');
            }
            
            //take the first professor in search results 
            else{
                var prof_id = prof_list[0].getElementsByTagName('a')[0].getAttribute('href');
                user_url = page_url+prof_id
                page_url = proxy_url + user_url;
                setTimeout( function() {get_prof(page_url, user_url);}, 1000);
                console.log('Professor found.')
            }
		}
    }
    search_request.open("GET", search_url, true);
    search_request.send();
}
function get_prof(page_url, user_url) {
    var prof_request = new XMLHttpRequest();
	prof_request.onreadystatechange = function(){
		if (prof_request.readyState == 4 && prof_request.status == 200){

            //insert response.text into a div so we can search for elements within
            var prof_div = document.createElement('div');
            prof_div.innerHTML = prof_request.responseText;
            var ratings = prof_div.getElementsByClassName('grade');
            var num_ratings = prof_div.getElementsByClassName('table-toggle rating-count active');
            var tag_list = prof_div.getElementsByClassName('tag-box-choosetags');

            //insert ratings into popup
            var overall = 'Overall Rating: ' + ratings[0].innerText.trim() + '/5.0';
            var again = 'Take Again Percent: ' + ratings[1].innerText.trim();
            var difficulty = 'Difficulty: ' + ratings[2].innerText.trim() + '/5.0';
            var num = num_ratings[0].innerText.trim();
            var tags = 'No tags available.';
            if (tag_list.length == 1) {
                tags = 'Tags: ' + tag_list[0].innerText;
            }
            else if (tag_list.length == 2) {
                tags = 'Tags: ' + tag_list[0].innerText + ', ' + tag_list[1].innertext;
            }
            else {
                tags = 'Tags: ' + tag_list[0].innerText + ', ' + tag_list[1].innerText + ', ' + tag_list[2].innerText;
            }

            console.log(overall);
            console.log(again);
            console.log(difficulty);
            console.log(tags);
            console.log(num);
            console.log(user_url);
		}
    }
    prof_request.open("GET", page_url, true);
    prof_request.send();
}

//opens stat box
function open_box() {
    //get information and display
    setTimeout(get_description, 100);
    console.log('Getting information from description.');

    var popup_title = document.getElementById('popup_title');
    popup_title.classList.toggle("show");

    //var popup_overall = document.getElementById('popup_overall');
    //popup_overall.classList.toggle("show");
    //var popup_difficulty = document.getElementById('popup_difficulty');
    //popup_difficulty.classList.toggle("show");
    //var popup_num = document.getElementById('popup_num');
    //popup_num.classList.toggle("show");

    console.log('Popup box opened.');
}

//function for updating course_list and schedule_list
function update_lists(){
    course_list = document.getElementsByClassName('course-box-content');
    for (var i = 0; i < course_list.length; i++){
        course_list[i].addEventListener('click', inject_cell);
    }
    schedule_list = document.getElementsByClassName('schedule-slot');
    for (var i = 0; i < schedule_list.length; i++){
        schedule_list[i].addEventListener('click', inject_cell);
    }
    plus_list = document.getElementsByClassName('course-box-button course-box-add-button icon ion-plus')
    for (var i = 0; i < plus_list.length; i++) {
        plus_list[i].addEventListener('click', function(){ 
            setTimeout(update_lists, 1000);
        })
    }
    ex_list = document.getElementsByClassName('course-box-button course-box-remove-button icon ion-close');
    for (var i = 0; i < ex_list.length; i++) {
        ex_list[i].addEventListener('click', function(){ 
            setTimeout(update_lists, 1000);
            })
    }
    console.log('lists updated');
}

//update course_list and schedule_list automatically after 3 minutes
setInterval(update_lists, 180000);

///////////////////////////////////////////////////////////////////////////////////////////////////////
//--------------------------------------Event Listeners------------------------------------------------
///////////////////////////////////////////////////////////////////////////////////////////////////////

//inject button when course is clicked on
var course_list = document.getElementsByClassName('course-box-content');
for (var i = 0; i < course_list.length; i++){
    course_list[i].addEventListener('click', inject_cell);
}
//inject button when course on schedule is clicked on
var schedule_list = document.getElementsByClassName('schedule-slot');
for (var i = 0; i < schedule_list.length; i++){
    schedule_list[i].addEventListener('click', inject_cell);
}

//create new schedule_list and course_list when user types in search box 
document.getElementById('course-search-course-name-input').addEventListener('input', function(){ 
    setTimeout(update_lists, 1000);
    });
//update schedule_list, course_list, plus_list, and ex_list when user adds/removes course from schedule
plus_list = document.getElementsByClassName('course-box-button course-box-add-button icon ion-plus')
for (var i = 0; i < plus_list.length; i++) {
    plus_list[i].addEventListener('click', function(){ 
        setTimeout(update_lists, 1000);
        })
}
ex_list = document.getElementsByClassName('course-box-button course-box-remove-button icon ion-close');
for (var i = 0; i < ex_list.length; i++) {
    ex_list[i].addEventListener('click', function(){ 
        setTimeout(update_lists, 1000);
        })
}