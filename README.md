# 5CRateMyP Chrome Extension

This is a Chrome extension that allows Claremont College students to easily see 5C professor ratings while constructing their schedule! Statistics include overall rating, average difficulty, take-again percentage, number of student ratings, and top tag. This is meant to be used on the Claremont Colleges course scheduling site Hyperschedule. 

Check it out on the Chrome Web Store [here.](https://chrome.google.com/webstore/detail/5c-ratemyp/gimpfegdhjdapchojnlagmobkpdllacm?hl=en)

![Example Image](example/rmpExample.png)

### How was this developed?

The core of this extension lies in the content script. It first injects a button into the course description box whenever the course is clicked on. Upon click of the 5CRateMyP button, information such as the class's professor and campus are gathered and used as a search query.

Using the professor's name, the extension checks if the professor is already in the storage dictionary and will retrieve the associated HTML/CSS div that already has the statistics formatted for the user to see. Otherwise, two XMLHTTP requests are sent to RMP to get the teacher's unique page id and then the teacher's statistics. The statistics are then aesthetically displayed in a popup to the user and the popup is stored in the storage dictionary with the professor's name as the key.

In order to send requests to other sites not of the smae origin, a Node.js reverse proxy server hosted on Heroku was needed. This is due to CORS limitations.

There were several edge cases that needed to be addressed. Queries are paired by professor name and campus, so searches may turn up with no results. If this is the case, then the professor is either not on RMP or is listed under another school. A link is provided at the bottom of the popup shown to the user for a query on RMP that only has the profesor name. A professor could also be found on RMP but have no ratings. This could mean they are new to the school and may be listed under another school, so a link is provided at the bottom of the popup for a query that only has the professor name. In the case of multiple professors with the same name and same campus, the top result is taken (although this is quite rare). 


