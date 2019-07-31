//sends message to background script to activate extension icon
chrome.runtime.sendMessage({type:'showPageAction'});
console.log("initialized extension");

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
    var stats = document.createElement('span');
    stats.id = 'stats';
    stats.innerText = 'Professor Ratings:';
    stats.className = "popuptext";
    container.appendChild(stats);

    //injection        
    var description_box = document.getElementById('course-description-box');
    description_box.prepend(container);
    description_box.prepend(document.createElement('hr'));
    description_box.prepend(button);
    console.log('button injected');
    
    //in case of course description text overflow due to button injection
    var description_container = document.getElementById('course-description-box-outer')
    description_container.style.height = "auto";

    //open popup on button click 
    document.getElementById('rmp-button').addEventListener('click', open_box);

    //scrape information and display
    setTimeout(scrape, 1000);
    console.log('scraping information');
}

//function for scraping professor and class information
function scrape() {
    //get information from description box
    var description_box = document.getElementById('course-description-box');
    var rows = description_box.children.length;
    var class_info = description_box.firstChild.nextSibling.nextSibling.nextSibling;
    var campus = class_info.innerText.split(' ')[2].slice(0,2);
    var prof_name = class_info.nextSibling.nextSibling.nextSibling.nextSibling;

    //case with extra row (rows usually 12)
    if (rows == 14) {
        prof_name = prof_name.nextSibling.nextSibling;
    }
    console.log(class_info.innerText);
    console.log(prof_name.innerText);

    //format and display
    var popup = document.getElementById('stats');
    var names = prof_name.innerText.split('and').join(',').split(',');
    //case with two professors
    if (names.length == 4) {
        popup.innerText = "Prof. " + names[1].trim() + ' ' + names[0].trim() + " and Prof. " + names[3].trim() + ' ' + names[2].trim() + ':';
    }
    //case with one professor
    else if (names.length == 2) {
        popup.innerText = "Prof. " + names[1].trim() + ' ' + names[0].trim() + ':';

    }
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

//message content script to inject button when course is clicked on
var course_list = document.getElementsByClassName('course-box-content');
for (var i = 0; i < course_list.length; i++){
    course_list[i].addEventListener('click', inject_cell);
}
//message content script to inject button when course on schedule is clicked on
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

//opens stat box
function open_box() {
    var stats = document.getElementById('stats');
    stats.classList.toggle("show");
    console.log('stat box opened');
}

