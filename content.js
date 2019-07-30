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

//function to inject button next to add-course plus button
function inject_cell(){
    var button = document.createElement('BUTTON');
    button.innerHTML = '5C RateMyP';
    button.id = 'rmp-button'
        
    var description_box = document.getElementById('course-description-box');
    description_box.prepend(document.createElement('hr'));
    description_box.prepend(button);
    console.log('button injected');
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
            setTimeout(update_lists, 2000);
        })
    }
    ex_list = document.getElementsByClassName('course-box-button course-box-remove-button icon ion-close');
    for (var i = 0; i < ex_list.length; i++) {
        ex_list[i].addEventListener('click', function(){ 
            setTimeout(update_lists, 2000);
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
    setTimeout(update_lists, 2000);
    });
//update schedule_list, course_list, plus_list, and ex_list when user adds/removes course from schedule
plus_list = document.getElementsByClassName('course-box-button course-box-add-button icon ion-plus')
for (var i = 0; i < plus_list.length; i++) {
    plus_list[i].addEventListener('click', function(){ 
        setTimeout(update_lists, 2000);
        })
}
ex_list = document.getElementsByClassName('course-box-button course-box-remove-button icon ion-close');
for (var i = 0; i < ex_list.length; i++) {
    ex_list[i].addEventListener('click', function(){ 
        setTimeout(update_lists, 2000);
        })
}

//open popup on button click 