/*
modifier.js

This is the main file of the CanvasGrade extension. It has a single purpose: count earned points and total points and display your grade.
It does this by accessing the html table of the website and doing some simple math. This file also saves the relevant information to Chrome's
Storage system (which has terrible documentation). It is made to be easy to understand.

Authors: Jack Hughes

Date of creation: 10/5/20

-JBH
*/

/*
|                       |
|    GLOBAL-VARIABLES   |
|                       |
 */
//TABLE: the html element containing the html table with all assignment grades
const TABLE = document.querySelector("#grades_summary > tbody");
//Storing the table html in chunks for peripherals:
let tableHtmlFrontHalf = `
<table class='summary' style="display: table;">
    <thead>
    <tr>
        <th scope="col">Group</th>
        <th scope="col">Weight</th>
    </tr>
    </thead>
    <tbody>
    `;
let tableHtmlBackHalf = `
    <tr style="font-weight: bold;">
        <th scope="row">Must be 100%:</th>
        <td>100%</td>
    </tr>
    </tbody>
</table>
`;
let tableHtml = "";
tableHtml = tableHtml.concat(tableHtmlFrontHalf);

//Initialize stylesheet--thanks stackoverflow
let css = 'input[type=number]{\n' +
    '    width: 40px;\n' +
    '}' +
    'input[type=checkbox]{' +
    'appearance: auto;' +
    '}',
    head = document.head || document.getElementsByTagName('body')[0],
    style = document.createElement('style');
head.appendChild(style);
style.type = 'text/css';
if (style.styleSheet){
    // This is required for IE8 and below.
    style.styleSheet.cssText = css;
} else {
    style.appendChild(document.createTextNode(css));
}
//Getting rid of the dumb random checkbox nobody uses in the peripherals area:
document.querySelector("#only_consider_graded_assignments_wrapper").remove();


//outputField: the html element in which the overall grade will be outputted
let outputField = document.querySelector("#student-grades-final");

//weighted: a boolean to determine whether or not the class contains weighted categories (true) or is total points (false).
console.log(document.querySelector("#assignments-not-weighted > div:nth-child(1) > h2").textContent);
let weighted = (document.querySelector("#assignments-not-weighted > div:nth-child(1) > h2").textContent !== "Course assignments are not weighted.");
let weights = [];
if(weighted){
    let arr = Array.from(document.querySelector("#assignments-not-weighted > div:nth-child(1) > table > tbody").rows);
    let i = 0;
    arr.forEach(tr=>{
        let path = "#assignments-not-weighted > div:nth-child(1) > table > tbody > tr:nth-child(" + (i + 1) + ") > td";
        weights[i] = document.querySelector(path).textContent.match(/\d+/);
        i++;
    });
}
//SHORT_TABLE_PATH: a different way of accessing the html table element (weird details of the mutationObserver class require this)
const SHORT_TABLE_PATH = document.getElementById("grade-summary-content");
//finalGrade: a variable to store the final grade in the class at the end of the program.
let finalGrade;

//nameOfClass: the name of the class displayed on the canvas website e.g. 'Honors Precalculus'. Starts as an empty string literal.
let nameOfClass = '';

//nameOfClassFull: the raw unformatted name of the class
let nameOfClassFull = String(document.querySelector('#breadcrumbs > ul > li:nth-child(2) > a > span').textContent);

//MUTATION_OBSERVER: the class used to detect mutations to the page. Will be implemented in the execution and helper methods sections.
const MUTATION_OBSERVER = new MutationObserver(function(mutations){
    mutationObserverCallback(mutations);
});

//this if statement removes any of the alphanumeric garbage kent has in class names and stores the result in nameOfClass
if(nameOfClassFull.indexOf('-') !== -1){
    let nameOfClassArray = nameOfClassFull.split('-');
    nameOfClass += nameOfClassArray[1];
}
//if somehow there is no alphanumeric garbage, there's no need for further formatting.
else{
    nameOfClass+= nameOfClassFull;
}

//isHonors: a boolean variable that is true if the class is honors/AP.
//There is potentially a better way to implement this but I have not found one yet.
let isHonors = nameOfClass.includes(' Honors') ||
    nameOfClass.includes(' honors') ||
    nameOfClass.includes(' AP') ||
    nameOfClass.includes('AP ') ||
    nameOfClass.includes('Honors ') ||
    nameOfClass.includes('honors ');

//Encoding for when I save the results of the program to storage, this is referenced in popup.js
if(isHonors){
    nameOfClass += '__HONORS'; //DESIGNATES HONORS
}
else{
    nameOfClass += '__NORMAL'; //DESIGNATES NOT HONORS
}

//further encoding formatting; removes all spaces and replaces them with a hyphen
nameOfClass = nameOfClass.split(' ').join('-');

//more encoding stuff
//updateCode: canvas's numeric code they have for every class. This is stored and used by the popup to update the grade information for the current
//class in the future (meaning it just opens the class grade page in a new tab but it needs this number to do so.
let updateCode = document.querySelector('#breadcrumbs > ul > li:nth-child(2) > a').href;
//fetch just the numbers of the code, no slashes or other hyperlink garbage
updateCode = updateCode.split('/')[4];
//add it to nameOfClass for storage at the end of the program
nameOfClass += '___' + updateCode;

//letterGrade: a variable that will store the letter grade in this class
let letterGrade;

/*
|                       |
|    HELPER-METHODS     |
|                       |
 */

//This method returns true if the inputted assignment (a row in the table) contains the "grade was changed" span (meaning it's a what-if-score)
function wasChanged(tr){
    let htmlPath = "#" + tr.id + " > td.assignment_score > div > span.tooltip > span";
    return document.querySelector(htmlPath).className === "grade changed";
}

//This function updates all of the weights (updating the global variable)
function updateWeights(){
    let arr = Array.from(document.querySelector("#assignments-not-weighted > div:nth-child(1) > table > tbody").rows);
    let i = 0;
    let total = 0;
    arr.forEach(tr=>{
        let name = document.querySelector("#assignments-not-weighted > div:nth-child(1) > table > tbody > tr:nth-child(" + (i+1) + ") > th").textContent;
        if(name !== "Total" && name !== "Must be 100%:") {
            let path = "#assignments-not-weighted > div:nth-child(1) > table > tbody > tr:nth-child(" + (i + 1) + ") > td > input";
            weights[i] = document.querySelector(path).value;
            total += Number(weights[i]);
        }
        else{
            let path = "#assignments-not-weighted > div:nth-child(1) > table > tbody > tr:nth-child(" + (i + 1) + ") > td";
            let otherPath = "#assignments-not-weighted > div:nth-child(1) > table > tbody > tr:nth-child(" + (i + 1) + ") > th";
            document.querySelector(path).textContent = total + "%";
            document.querySelector(otherPath).textContent = "Must be 100%:"
        }
        i++;
    });
}

//this function returns an array of all category names
function getCategories(){
    let rows = Array.from(TABLE.rows);
    let categories = [""];
    let counter = 0;
    rows.forEach(tr=>{
        let rowName = tr.className;
        if(rowName === "student_assignment assignment_graded editable" || (rowName === "student_assignment editable" && wasChanged(tr))){
            let path = "#" + tr.id + " > th > div";
            let category = document.querySelector(path).textContent;
            if(!categories.includes(category) && category !== ""){
                console.log(category);
                categories[counter] = category;
                counter++;
            }
        }
    });
    return categories;
}
let categories = getCategories();
for(let i = 0; i < categories.length; i++){
    tableHtml = tableHtml.concat(`
    <tr>
        <th scope="row">${categories[i].toString()}</th>
        <td>
            <input type="number" id="weightBox_0" value=${100.0/categories.length} class="weightBox">
        </td>
    </tr>
    `);
    weights[i] = 100.0/categories.length;
}
tableHtml = tableHtml.concat(tableHtmlBackHalf);

//this function sums a portion of the table; it can be used for weighted categories (use category) or for total points (just ignore category)
function sumTablePortion(htmlPath, category){
    let counter = 0; //counter variable to count the points in this part of the table
    let rows = Array.from(TABLE.rows); //Array object from the rows in the table element
    rows.forEach(tr => {
        let rowName = tr.className; //get the class of the current html row element
        //If the assignment is graded or the assignment has a what-if score in it, do stuff with it. Otherwise, it's a formatting element
        //so it should be ignored
        if(rowName === "student_assignment assignment_graded editable" || (rowName === "student_assignment editable" && wasChanged(tr))) {
            //It's an assignment not a formatting row and we should be counting it
            //countThisAssignment: whether or not we should count this assignment (is it the right category). Starts as true for when it's total points.
            let countThisAssignment = true;
            if (weighted) {
                //If it's a weighted class, check the assignment against the desired category
                //path: local variable to find the category of the given assignment
                let path = "#" + tr.id + " > th > div";
                //Gets the category of this assignment and compares it to inputted category
                countThisAssignment = document.querySelector(path).textContent === category;
            }
            if (countThisAssignment) {
                //If it's something we should count, count it!
                //Assemble full HTML path:
                let fullPath = "#" + tr.id + htmlPath;
                //Convert points into number and add to counter:
                //Also removes any commas so that you can input scores over 1000 if you want to LOL
                let DCAULF_WHY_ARE_YOU_TERRIBLE = parseFloat(document.querySelector(fullPath).textContent.replaceAll(',', ''));
                if(isNaN(DCAULF_WHY_ARE_YOU_TERRIBLE)){
                    DCAULF_WHY_ARE_YOU_TERRIBLE = 0;
                }
                counter += DCAULF_WHY_ARE_YOU_TERRIBLE;
            }
        }
    });
    return counter; //Return statement.
}

//This version of the method gets the total points for the whole class
function getTotalPoints(){
    let htmlPath = " > td.possible.points_possible"; //HTML path to get to the total points within the table data (td)
    return sumTablePortion(htmlPath);
}

//This method returns the earned total points
function getEarnedPoints(){
    let htmlPath = " > td.assignment_score > div > div > span.what_if_score "; //HTML path to get to the total points within the table data (td)
    return sumTablePortion(htmlPath);
}

//This version of the method goes through a category and gets total points of category
function getCategoryTotalPoints(category){
    let htmlPath = " > td.possible.points_possible"; //HTML path to get to the total points within the table data (td)
    return sumTablePortion(htmlPath, category);
}
//Returns earned points in a category
function getCategoryEarnedPoints(category){
    let htmlPath = " > td.assignment_score > div > div > span.what_if_score"; //HTML path to get to the total points within the table data (td)
    return sumTablePortion(htmlPath, category);
}

//This method calculates a percentage and rounds to two decimal places.
function calculatePercentage(earned, total){
    if(Number.isNaN(earned) || Number.isNaN(total)){
        //If either number is NaN, return something applicable
        return "--%"
    }
    let step1 = earned/total;
    return (100 * step1).toFixed(2);
}

//This method removes all spaces up to the first non space and all spaces after the last non-space in a string.
function removeEdgeSpaces(input){
    return input.trim();
}

//This method displays the final grade that is passed into it
function displayFinalGrade(grade){
    //LetterGrade Section:
    letterGrade = "F";
    if(grade >= 60 && grade < 63){letterGrade = "(D-)";}
    else if(grade >= 63 && grade < 67) {letterGrade = "(D)";}
    else if(grade >= 67 && grade < 70) {letterGrade = "(D+)";}
    else if(grade >= 70 && grade < 73) {letterGrade = "(C-)";}
    else if(grade >= 73 && grade < 77) {letterGrade = "(C)";}
    else if(grade >= 77 && grade < 80) {letterGrade = "(C+)";}
    else if(grade >= 80 && grade < 83) {letterGrade = "(B-)";}
    else if(grade >= 83 && grade < 87) {letterGrade = "(B+)";}
    else if(grade >= 87 && grade < 90) {letterGrade = "(B+)";}
    else if(grade >= 90 && grade < 93) {letterGrade = "(A-)";}
    else if(grade >= 93 && grade < 97) {letterGrade = "(A)";}
    else if(grade >= 97) {letterGrade = "(A+)";}
    outputField.textContent = String(grade + "% " + letterGrade);
    return letterGrade;
}

/*
|                       |
|     MAIN-METHODS      |
|                       |
 */

//This method (and preliminary lines) sets up the weight options area of the webpage
let oldElem = document.querySelector("#assignments-not-weighted > div:nth-child(1) > h2");
console.log(weighted);
if(weighted) {
    oldElem.innerHTML = `
        <input type="checkbox" id="weight" value=${weighted} checked>
        <label for="weighted">Assignments are weighted by group</label>
        </input>
    `;
}
else{
    oldElem.innerHTML = `
        <input type="checkbox" id="weight" value=${weighted}>
        <label for="weighted">Assignments are weighted by group</label>
        </input>
    `;
}
let checkbox = document.getElementById("weight");
if(categories.length === 1){
    //@ Ms. Stacho (and others) if your class is not weighted, you don't need to tell canvas that it's weighted and make one category called "total points"
    //literally doing nothing is better than whatever you are doing.
    weighted = false;
    checkbox.disabled = true;
}
checkbox.addEventListener("input", function () {
    MUTATION_OBSERVER.disconnect();
    checkbox.value = !checkbox.value;
    if (checkbox.value) {
        //Weighted
        weighted = true;
        initPeripherals(true);
        initPeripherals(false);
    } else {
        weighted = false;
        initPeripherals(true);
        initPeripherals(false);
    }
    main();
});
function initPeripherals(isFirst) {
    let categoryWeightsHTML = document.querySelector("#assignments-not-weighted > div > table > tbody");
    let hideHTML = document.querySelector("#assignments-not-weighted > div > table");
    if (hideHTML === null) {
        document.querySelector("#assignments-not-weighted > div:nth-child(1)").appendChild(document.createElement("table"));
        document.querySelector("#assignments-not-weighted > div:nth-child(1) > table").innerHTML = tableHtml;
    }
    hideHTML = document.querySelector("#assignments-not-weighted > div > table");
    weighted = document.getElementById("weight").checked;
    let checkbox = document.getElementById("weight");
    if(categories.length === 1){
        //@ Ms. Stacho (and others) if your class is not weighted, you don't need to tell canvas that it's weighted and make one category called "total points"
        //literally doing nothing is better than whatever you are doing.
        weighted = false;
        checkbox.disabled = true;
    }
    let counter = 0;
    categoryWeightsHTML = document.querySelector("#assignments-not-weighted > div > table > tbody");
    let weightTable = Array.from(categoryWeightsHTML.rows);
    weightTable.forEach(tr => {
        let name = document.querySelector("#assignments-not-weighted > div:nth-child(1) > table > tbody > tr:nth-child(" + (counter + 1) + ") > th").textContent;
        //console.log(name);
        if (name !== "Total" && name !== "Must be 100%:") {
            //Not the total row, act as normal
            let weightBoxHttp =
                `
                     <input class="weightBox" type="number" id="weightBox_${counter}" value=${weights[counter]} >
                     </input>
                    `;
            let elem = document.querySelector("#assignments-not-weighted > div:nth-child(1) > table > tbody > tr:nth-child(" + (counter + 1) + ") > td");
            elem.innerHTML = weightBoxHttp;
            if (!isFirst) {
                let form = document.getElementById("weightBox_" + counter);
                form.addEventListener("input", function () {
                    main();
                });
            }
        }
        counter++;
    });
    if(weighted){
        hideHTML.style.display = "table";
    }
    else{
        hideHTML.style.display = "none";
    }
}
//This method passes in a category, it goes through the table and finds the total row of the entered category.
//Then, it formats it to say the correct thing.
function updateCategoryTotalRow(category, weight){
    let rows = Array.from(TABLE.rows); //Array object made from gradeTable rows
    let titlePath = " > th";
    let earnedPath = " > td.assignment_score";
    let totalPath = " > td.possible.points_possible";
    let detailsPath = " >  td.details";
    //Now we find the index of the total row and then do some stuff with it
    rows.forEach(tr => {
        let rowName = tr.className;
        if(rowName === "student_assignment hard_coded group_total"){
            let path = "#" + tr.id + " > th";
            let curCategory = document.querySelector(path).textContent; //Gets the category of this assignment
            let pathAfterFirstUpdate = "#" + tr.id + " > th > p"
            let curCategoryAfterUpdate = "";
            //Gets the category after the first update (b/c that changes the html of the title row meaning the original way no longer works
            //in try/catch for the first run bc this element won't exist which makes chrome upset
            try {
                curCategoryAfterUpdate = removeEdgeSpaces(document.querySelector(pathAfterFirstUpdate).textContent.split("(")[0]);
            }catch(exception){
            }
            let curCategoryFormatted = removeEdgeSpaces(curCategory);
            if(curCategoryFormatted === category || curCategoryAfterUpdate === category){
                //Total row of the desired category found.
                //Begin updating.
                //Paths to get to data in the row so that we can change it easily
                let finalTitlePath = "#" + tr.id + titlePath;
                let finalEarnedPath = "#" + tr.id + earnedPath;
                let finalTotalPath = "#" + tr.id + totalPath;
                let finalDetailsPath = "#" + tr.id + detailsPath;
                //Begin changing data:
                //Percentage in this category
                let roundedVar = calculatePercentage(getCategoryEarnedPoints(category),getCategoryTotalPoints(category));
                //Convert that to a string
                let percentString = String(roundedVar) + "%";
                //String to say how much this category is worth in your overall grade
                let titleString = category + " (" + weight + "% of final grade)";
                //Add titleString to page
                document.querySelector(finalTitlePath).innerHTML = "<p style=\"font-size:100%\"> <b>" + titleString + "</b> </p>";
                //Add category score to page
                document.querySelector(finalEarnedPath).innerHTML = getCategoryEarnedPoints(category).toFixed(2);
                //Add total category points to page
                document.querySelector(finalTotalPath).innerHTML = "<p style=\"font-size:130%\" title> <b>" + getCategoryTotalPoints(category) + "</b> </p>";
                //Add total category earned points to page
                document.querySelector(finalDetailsPath).innerHTML = "<p style=\"font-size:120%\"> <b>" + percentString + "</b> </p>";

            }
        }
    })
}

//This method does not pass in a category. It is for unweighted classes.
function updateTotalRow(){
    let rows = Array.from(TABLE.rows); //Array object made from gradeTable rows
    let titlePath = " > th";
    let earnedPath = " > td.assignment_score";
    let totalPath = " > td.possible.points_possible";
    let detailsPath = " >  td.details";
    let foundMainRow = false;
    //Now we find the index of the total row and then do some stuff with it
    rows.forEach(tr => {
        let rowName = tr.className;
        if(foundMainRow){
            tr.remove(); //Remove per-category rows if it's not a weighted class because the TOTAL row will always be first
        }
        else if(rowName === "student_assignment hard_coded group_total"){
            foundMainRow = true;
            //Total row of the desired category found.
            //Begin updating.
            //Paths to get to data in the row so that we can change it easily
            let finalTitlePath = "#" + tr.id + titlePath;
            let finalEarnedPath = "#" + tr.id + earnedPath;
            let finalTotalPath = "#" + tr.id + totalPath;
            let finalDetailsPath = "#" + tr.id + detailsPath;
            //Begin changing data:
            let percentString = String(calculatePercentage(getEarnedPoints(),getTotalPoints()) + "%");
            document.querySelector(finalTitlePath).innerHTML = "Total:";
            document.querySelector(finalEarnedPath).innerHTML = getEarnedPoints().toFixed(2);
            //toFixed is for rounding--otherwise canvas produces this really really weird formatting issue where it has a number that's
            // eight decimal places when it should be a whole number
            document.querySelector(finalTotalPath).innerHTML = "<p style=\"font-size:130%\" title> <b>" + getTotalPoints() + "</b> </p>";
            document.querySelector(finalDetailsPath).innerHTML = percentString;
        }
    })
}

//This function is the main function. It calls all main functions and applicable helper functions. The end result is an updated page and storage.
let numRuns = 0;
function main(){
    MUTATION_OBSERVER.disconnect();
    finalGrade = 0.0;
    if(weighted) {
        updateWeights();
        //Class is weighted
        //Running total of grade
        //HTML shmorgeshborg of weights and categories
        let categoryWeightsHTML = document.querySelector("#assignments-not-weighted > div:nth-child(1) > table > tbody");
        let counter = 0;
        for (let row of categoryWeightsHTML.rows) {
            //Set up all arrays
            let category = row.cells[0].textContent; //current category number
            let weight = weights[counter];
            //Update format
            updateCategoryTotalRow(category, weight);
            //Update running grade total
            let curGrade = (weight * (getCategoryEarnedPoints(category) / getCategoryTotalPoints(category)));
            if (!Number.isNaN(curGrade)) {
                //add curGrade to the total
                finalGrade += curGrade
            }
            counter++;
        }
    }
    else{
        //Class is not weighted
        finalGrade = calculatePercentage(getEarnedPoints(),getTotalPoints());
        updateTotalRow();
    }
    finalGrade = Number(finalGrade).toFixed(2);
    //console.log(finalGrade);
    letterGrade = displayFinalGrade(finalGrade);
    console.log(numRuns);
    numRuns++;
    return letterGrade;
}

//mutationObserverCallback: The callback function for my MUTATION_OBSERVER object.
//Whenever one thing is changed, a set of mutations occurs and an array
//of said mutations is returned into the callback. I limit the number of times it re-executes the
//program to one time per set of mutations for performance and to limit console spam while debugging
function mutationObserverCallback(mutations){
    let done = false; //Variable to shoddily improve performance:
    //Storage variables:
    let dataObj = {};
    let nameOfClassStorage;
    let letterGradeStorage;
    //STOP OBSERVING, because re-execution will cause many mutations (obviously)
    MUTATION_OBSERVER.disconnect();
    //Get letterGrade and execute main function
    letterGrade = main(MUTATION_OBSERVER);
    //console.log(letterGrade);
    //add CanvasClass_ to the start of our nameOfClass variable from the top
    nameOfClassStorage = 'CanvasClass_' + nameOfClass;
    //console.log(nameOfClassStorage);
    //additional variable bc chrome.storage is super weird, this bug took literal months to fix
    letterGradeStorage = letterGrade;
    //additional variable bc chrome.storage is super weird, this bug took literal months to fix
    dataObj[nameOfClassStorage] = letterGradeStorage;
    //After one run of main function, update storage
    chrome.storage.sync.set(dataObj);
    //Begin observing again
    MUTATION_OBSERVER.observe(SHORT_TABLE_PATH, {
        childList: true,
        subtree: true
    });
}

/*
|                       |
|       EXECUTION       |
|                       |
 */
//Run the peripheral-setup functions on initial load (weight options, etc.)
initPeripherals(true);
initPeripherals(false);
//Run the main function for the first time--on initial loading of page
main();

//Begin observing for the first time, await mutations and when they happen, the callback at the end of MAIN-METHODS is executed to re-run main().
MUTATION_OBSERVER.observe(SHORT_TABLE_PATH, {
    //Only observes the table element and all of its children
    childList: true,
    subtree: true
});