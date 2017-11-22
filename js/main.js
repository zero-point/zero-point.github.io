// save chosen linear,etc functions in JSON to be recovered and lists of no's generated
// depending on the condition, a different JSON element is chosen and fed into a function (together with the pres style)
// that function then creates the bar/scatter plot with the given data
// TODO: alert/ infobox if user doesn't do anything

function loadJSON(path,callback) {

    var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
    xobj.open('GET', path, true); // Replace 'my_data' with the path to your file
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
          }
    };
    xobj.send(null);
 }

function randomCondition(){
  var presentationTypes = ["bar","scatter-nomem","scatter-fullmem"];
  var functionTypes = ["linear","quadratic","periodic"];
  return [presentationTypes[Math.floor(Math.random()*presentationTypes.length)],functionTypes[Math.floor(Math.random()*functionTypes.length)]];
  //return [presentationTypes[2],functionTypes[0]];
}

function closeMsg() {
  document.querySelector("#myNav").style.width = "0%";
  document.querySelector(".overlay-content").innerHTML = "";
}

function openMsg(closeGuess, judgementCount, currentMode){
  console.log(currentMode);
  var text = document.createElement('a');
  if (currentMode.includes("train")) {
    if (closeGuess) {
        text.innerHTML = "Good job! <br/><br/> " + (totalJudgements-judgementCount-1) + " more to go";
        document.querySelector(".overlay-content").appendChild(text);
    }
    else {
      text.innerHTML = "Not quite, try again";
      document.querySelector(".overlay-content").appendChild(text);
    }
  }
  else {
    text.innerHTML = "" + (totalJudgements-judgementCount-1) + " more to go";
    document.querySelector(".overlay-content").appendChild(text);
  }
  document.querySelector("#myNav").style.width = "100%";
}

function displayInstructions(condition){
  loadJSON('exp_input.json', function(data){
    var parsed_data = JSON.parse(data);
    document.querySelector(".instructionText").innerHTML = parsed_data["instructions"][condition];
  });
}

function barPlot(xyValues, currentMode, expCondition){

  var horiz = document.createElement('div');
  var vert = document.createElement('div');
  var space = document.createElement('div');
  space.className = "col-md-1";

  document.querySelector(".container").appendChild(horiz);
  document.querySelector(".container").appendChild(space);
  document.querySelector(".container").appendChild(vert);

  if(debugmode){
    judgementCount = 34;
    document.getElementById('judgementCount').innerHTML = "Judgment "+(judgementCount+1)+" out of 40";
    document.querySelector(".nextScenarioButton").style="display:inline";
  }
  else {
    judgementCount = 0;
  }

  var submittedPoints = [];
  var closeGuess = false;
  var selection_made = false;
  var spaced = false;
  var selection_made = false;

  /* size of black containers */
  var widthX = 504,
    heightX = 100,
    widthY = 100,
    heightY = 504,                      // TODO: should the size of the plots be relative to the users' screen?
    paddedHeightY = heightY-2,
    paddedWidthX = widthX-2,
    paddedHeightX = heightX-4,
    paddedWidthY = widthY-4;

  /* scale of blue rectangles*/
  var blueWidthX = 500,
      blueHeightY = 500,
      scaleX,
      scaleY;
  if (currentMode.includes("train")) {
    scaleX = d3.scaleLinear()
      .domain([Math.min.apply(null, xyValues[0]), Math.max.apply(null, xyValues[0])])
      .range([0, blueWidthX/2]);
    scaleY = d3.scaleLinear()
      .domain([Math.min.apply(null, xyValues[1]), Math.max.apply(null, xyValues[1])])
      .range([0, blueHeightY/2]);
  }
  else {
    scaleX = d3.scaleLinear()
      .domain([Math.min.apply(null, xyValues[0]), Math.max.apply(null, xyValues[0])])
      .range([blueWidthX/2, blueWidthX]);
    scaleY = d3.scaleLinear()
      .domain([Math.min.apply(null, xyValues[1]), Math.max.apply(null, xyValues[1])])
      .range([blueHeightY/2, blueHeightY]);
  }

  var svgX = d3.select(horiz)
  .append("svg")
    .attr("width", widthX)
    .attr("height", heightX)
    .attr("style", "outline: 2px solid black;")

  var svgY = d3.select(vert)
    .append("svg")
      .attr("width", widthY)
      .attr("height", heightY)
      .attr("style", "outline: 2px solid black;")
      .on("click", clicked)

  var blueXRect = svgX.append("rect")
      .attr('id',"left_blue")
      .attr('x', 2)
      .attr('y', 2)
      .style('stroke', 'steelblue')
      .style('fill', 'steelblue')
      .attr("width", scaleX(xyValues[0][judgementCount]))   // scaling the x axis values to the width of the rectangle
      .attr("height", paddedHeightX);   // the blue rectangle on the left (representing X axis value) has a height of set size with padding

  function blueYRect(yValue){
    return svgY.append("rect")
      .attr('id',"temp_blue")
      .attr('x', 2)
      .attr('y', yValue)
      .style('stroke', 'steelblue')
      .style('fill', 'steelblue')
      .attr("width", paddedWidthY)
      .attr("height", paddedHeightY-yValue);
  }
  function redYRect(){
    if (currentMode.includes("train")) {
      var feedback = scaleY(xyValues[1][judgementCount]);
      svgY.append("rect")
        .attr('id',"temp_red")
        .attr('x', 2)
        .attr('y', paddedHeightY-feedback)
        .attr("width", paddedWidthY)
        .attr("height", feedback)
        .style('stroke', 'red')
        .style('fill', 'red');
    }
  }
  function clicked(d){

    if (d3.event.defaultPrevented) return; // dragged

    var coord = Math.round(Number(d3.mouse(this)[1]));
    if(coord>=2 && coord<=paddedHeightY){ // TODO: should 0 be allowed as a target value? (where target == 0 means coord == paddedHeightY == 500)
      selection_made = true;
      var target = paddedHeightY-coord;
      var blueRect, redRect;
      if(spaced === false){
        svgY.select("#temp_blue").remove();
        blueRect = blueYRect(coord);
      }
      else {
        if (scaleY(xyValues[1][judgementCount])<target) {
          svgY.select("#temp_blue").remove();
          blueRect = blueYRect(coord);
          redYRect();
        }
        else {
          svgY.select("#temp_red").remove();
          svgY.select("#temp_blue").remove();
          redYRect();
          blueRect = blueYRect(coord);
        }
      }
      if ((Math.abs(scaleY(xyValues[1][judgementCount])-target)<25)||(currentMode.includes("test"))) {
        closeGuess = true;
      }
      selection_made = true;

      document.onkeyup = function(e) {
        var key = e.keyCode || e.which;
        if (key === 32 && selection_made) {
          console.log("space");
          spaced = true;
          redYRect();
          if (scaleY(xyValues[1][judgementCount])<target) {
          }
          else {
            svgY.select("#temp_blue").remove();
            blueRect = blueYRect(coord);
          }
        }
        if(key === 13 && selection_made){
          if (closeGuess) {      // TODO: in training should we force the user to see feedback or check for feedback (enter not allowed until after space)
            openMsg(true, judgementCount, currentMode);
            submittedPoints.push(target);
            closeGuess = false;
            judgementCount += 1;
            if(judgementCount!=totalJudgements){
              console.log("enter");
              document.getElementById('judgementCount').innerHTML = "Judgment "+(judgementCount+1)+" out of 40";
              svgY.select("#temp_blue").remove();
              svgY.select("#temp_red").remove();
              svgY.selectAll("#temp_red").remove();
              blueXRect
                .attr("width", scaleX(xyValues[0][judgementCount]));
              spaced = false;
              selection_made = false;
            }
            else {
              svgY.on("click", function(d){});
              document.querySelector(".nextScenarioButton").style="display:inline";
              console.log(submittedPoints);
              submitPoints(submittedPoints);
              //  localStorage.setItem('JSON_output', JSON.stringify(obj));
              // svgY.select("#temp_blue").remove();
              // svgX.select("#left_blue").remove();
              // svgY.select("#temp_red").remove();
              // svgY.selectAll("#temp_red").remove();
              d3.select(".container").selectAll("svg").remove();
            }
          }
          else {
            openMsg(false, judgementCount, currentMode);
          }
        }
      }
    }
  }
  document.querySelector(".nextScenarioButton").onclick = function() {
    checkStatus();
  }
}

function scatterFullMemPlot(xyValues){

  var content = document.createElement('div');
  content.className = "content";
  document.querySelector(".container").appendChild(content);

  if(debugmode){
    judgementCount = 34;
    document.getElementById('judgementCount').innerHTML = "Judgment "+(judgementCount+1)+" out of 40";
    document.querySelector(".nextScenarioButton").style="display:inline";
  }
  else {
    judgementCount = 0;
  }

  var submittedPoints = [];
  var closeGuess = false;
  var selection_made = false;
  var spaced = false;
  var selection_made = false;
  var circle_size = 4;

  var containerWidth = 500,
      containerHeight = 500;

  var chart = d3.select('.content')
  .append('svg')
  .attr('width', containerWidth)
  .attr('height', containerHeight)
  .attr("style", "outline: 2px solid black;");

  var margin = {top: margins, right: margins, bottom: margins, left: margins};
  var width = 500 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

  var outline = chart
    .append('rect')
    .attr('x',margin.left)
    .attr('y',margin.top)
    .attr('width', width)
    .attr('height', height)
    .style('stroke', '#5b9baf')
    .style('fill', 'transparent')

  var scaleX,
      scaleY;

  if (currentMode.includes("train")) {
    scaleX = d3.scaleLinear()
      .domain([Math.min.apply(null, xyValues[0]), Math.max.apply(null, xyValues[0])])
      .range([0, width/3]);
    scaleY = d3.scaleLinear()
      .domain([Math.min.apply(null, xyValues[1]), Math.max.apply(null, xyValues[1])])
      .range([height, height-height/3]);
  }
  else {
    scaleX = d3.scaleLinear()
      .domain([Math.min.apply(null, xyValues[0]), Math.max.apply(null, xyValues[0])])
      .range([width/3, width*2/3]);
    scaleY = d3.scaleLinear()
      .domain([Math.max.apply(null, xyValues[1]),Math.min.apply(null, xyValues[1])])
      .range([height/3, height*2/3]);
  }
  console.log("True values: ");
  console.log(xyValues);

  var currloc = margin.left + scaleX(xyValues[0][judgementCount]);
  for (var i = 0; i < xyValues[1].length; i++) {
    chart.append("circle")
        .attr("id","true")
        .attr("cx", margin.left + scaleX(xyValues[0][i]))
        .attr("cy", margin.bottom + scaleY(xyValues[1][i]))
        .attr("r", circle_size)
        .style("stroke", "orange")
        .style("fill", "transparent");
  }

  var redLine = chart.append("svg:line")
    .attr("id", "redLine")
    .attr("x1", currloc)
    .attr("y1", 0)
    .attr("x2", currloc)
    .attr("y2", height + margin.top + margin.bottom)
    .style("stroke-width", 2)
    .style("stroke", "red")
    .style("fill", "none");

  var widthOfBuffer = 40;
  var errorMargin = chart.append("svg:rect")
    .attr('x', currloc - widthOfBuffer/2)
    .attr('y', margin.top + scaleY(xyValues[1][judgementCount]) - accErrorMargin*height/3)
    .style('stroke', 'blue')
    .style('fill', 'transparent')
    .attr('width', widthOfBuffer)
    .attr('height', accErrorMargin*height/3*2);

  var buffer = chart.append("svg:rect")
    .attr('x', currloc - widthOfBuffer/2)
    .attr('y', margin.top)
    .style('stroke', '#add8e6')
    .style('fill', 'transparent')
    .attr('width', widthOfBuffer)
    .attr('height', height)
    .on("click", clicked);

  if(!debugmode){
    chart.selectAll("rect").style('stroke', 'transparent');
    chart.selectAll("#true").style('stroke', 'transparent');
  }

  var last_sel_circle;

  function clicked(d, i) {
    if (d3.event.defaultPrevented) return; // dragged
    d3.select(this).on('mousedown.drag', null);
    var coordinates = d3.mouse(d3.select('.content').node());
    var target = coordinates[1];
    if (chart.select("#last") != undefined){
      chart.select("#last").remove();
    }
    last_sel_circle = chart.append("circle")
      .attr("id","last")
      .attr("transform", "translate(" + [currloc,target] + ")")
      .attr("r", circle_size)
    selection_made = true;

    //console.log(Math.abs(target-scaleY(xyValues[1][judgementCount])));
    var trueValue = margin.top + scaleY(xyValues[1][judgementCount]);
    if ((Math.abs(trueValue-target)<=accErrorMargin*height/3)||(currentMode.includes("test"))) {
      closeGuess = true;
    }

    // SPACE KEY SAVES DATA
    document.onkeyup = function(e) {
      var key = e.keyCode || e.which;
      if (key == 32 && selection_made) {
        console.log("user hit space");
        if (currentMode.includes("train")) {
          chart.append("circle")
              .attr("cx", currloc )
              .attr("cy", margin.top + scaleY(xyValues[1][judgementCount]))
              .attr("r", circle_size)
              .style("fill", "red");
        }
      }
      if(key === 13 && selection_made){
        console.log("user hit enter");
        if (closeGuess) {
          openMsg(true, judgementCount, currentMode);
          submittedPoints.push(target);
          closeGuess = false;
          chart.append("circle")
              .attr("cx", currloc )
              .attr("cy", margin.top + scaleY(xyValues[1][judgementCount]))
              .attr("r", circle_size)
              .style("fill", "red");

          judgementCount += 1;
          if(judgementCount!=totalJudgements){
            document.getElementById('judgementCount').innerHTML = "Judgment "+(judgementCount+1)+" out of 40";
            if (chart.select("#last") != undefined){
              chart.select("#last").remove();
            }
            currloc = margin.left + scaleX(xyValues[0][judgementCount]);
            redLine.attr("x1", currloc)
                  .attr("x2", currloc);
            errorMargin
              .attr('x', currloc - widthOfBuffer/2)
              .attr('y', margin.top + scaleY(xyValues[1][judgementCount]) - accErrorMargin*height/3);
            buffer.attr('x', currloc-20);
            selection_made = false;
          }
          else {
            buffer.on("click", function(d){});
            d3.select(".content").selectAll("svg").remove();
            document.querySelector(".nextScenarioButton").style="display:inline"; // NextButton to quadratic
            console.log(submittedPoints);
            submitPoints(submittedPoints);
          }
        }
        else {
          openMsg(false, judgementCount, currentMode);
        }
      }
    }
  }
  document.querySelector(".nextScenarioButton").onclick = function() {
    checkStatus();
  }
}

function scatterNoMemPlot(xyValues){

  var content = document.createElement('div');
  content.className = "content";
  document.querySelector(".container").appendChild(content);

  if(debugmode){
    judgementCount = 34;
    document.getElementById('judgementCount').innerHTML = "Judgment "+(judgementCount+1)+" out of 40";
    document.querySelector(".nextScenarioButton").style="display:inline";
  }
  else {
    judgementCount = 0;
  }

  var submittedPoints = [];
  var closeGuess = false;
  var selection_made = false;
  var spaced = false;
  var selection_made = false;
  var circle_size = 4;

  var containerWidth = 500,
      containerHeight = 500;

  var chart = d3.select('.content')
  .append('svg')
  .attr('width', containerWidth)
  .attr('height', containerHeight)
  .attr("style", "outline: 2px solid black;");

  var margin = {top: margins, right: margins, bottom: margins, left: margins};
  var width = 500 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

  var outline = chart
    .append('rect')
    .attr('x',margin.left)
    .attr('y',margin.top)
    .attr('width', width)
    .attr('height', height)
    .style('stroke', '#5b9baf')
    .style('fill', 'transparent')

  var scaleX,
      scaleY;

  if (currentMode.includes("train")) {
    scaleX = d3.scaleLinear()
      .domain([Math.min.apply(null, xyValues[0]), Math.max.apply(null, xyValues[0])])
      .range([0, width/3]);
    scaleY = d3.scaleLinear()
      .domain([Math.min.apply(null, xyValues[1]), Math.max.apply(null, xyValues[1])])
      .range([height, height-height/3]);
  }
  else {
    scaleX = d3.scaleLinear()
      .domain([Math.min.apply(null, xyValues[0]), Math.max.apply(null, xyValues[0])])
      .range([width/3, width*2/3]);
    scaleY = d3.scaleLinear()
      .domain([Math.min.apply(null, xyValues[1]), Math.max.apply(null, xyValues[1])])
      .range([height/3, height*2/3]);
  }
  console.log(xyValues);

  var currloc = margin.left + scaleX(xyValues[0][judgementCount]);
  for (var i = 0; i < xyValues[1].length; i++) {
    chart.append("circle")
        .attr("id","true")
        .attr("cx", margin.left + scaleX(xyValues[0][i]))
        .attr("cy", margin.bottom + scaleY(xyValues[1][i]))
        .attr("r", circle_size)
        .style("stroke", "orange")
        .style("fill", "transparent");
  }

  var redLine = chart.append("svg:line")
    .attr("id", "redLine")
    .attr("x1", currloc)
    .attr("y1", 0)
    .attr("x2", currloc)
    .attr("y2", height + margin.top + margin.bottom)
    .style("stroke-width", 2)
    .style("stroke", "red")
    .style("fill", "none");

  var widthOfBuffer = 40;
  var errorMargin = chart.append("svg:rect")
    .attr('x', currloc - widthOfBuffer/2)
    .attr('y', margin.top + scaleY(xyValues[1][judgementCount]) - accErrorMargin*height/3)
    .style('stroke', 'blue')
    .style('fill', 'transparent')
    .attr('width', widthOfBuffer)
    .attr('height', accErrorMargin*height/3*2);

  var buffer = chart.append("svg:rect")
    .attr('x', currloc - widthOfBuffer/2)
    .attr('y', margin.top)
    .style('stroke', '#add8e6')
    .style('fill', 'transparent')
    .attr('width', widthOfBuffer)
    .attr('height', height)
    .on("click", clicked);

  if(!debugmode){
    chart.selectAll("rect").style('stroke', 'transparent');
    chart.selectAll("#true").style('stroke', 'transparent');
  }

  var last_sel_circle;

  function clicked(d, i) {
    if (d3.event.defaultPrevented) return; // dragged
    d3.select(this).on('mousedown.drag', null);
    var coordinates = d3.mouse(d3.select('.content').node());
    var target = coordinates[1];
    if (chart.select("#last") != undefined){
      chart.select("#last").remove();
    }
    last_sel_circle = chart.append("circle")
      .attr("id","last")
      .attr("transform", "translate(" + [currloc,target] + ")")
      .attr("r", circle_size)
    selection_made = true;

    //console.log(Math.abs(target-scaleY(xyValues[1][judgementCount])));
    var trueValue = margin.top + scaleY(xyValues[1][judgementCount]);
    if ((Math.abs(trueValue-target)<=accErrorMargin*height/3)||(currentMode.includes("test"))) {
      closeGuess = true;
    }

    // SPACE KEY SAVES DATA
    document.onkeyup = function(e) {
      var key = e.keyCode || e.which;
      if (key == 32 && selection_made) {
        console.log("user hit space");
        if (currentMode.includes("train")) {
          chart.append("circle")
              .attr("id","feed")
              .attr("cx", currloc )
              .attr("cy", margin.top + scaleY(xyValues[1][judgementCount]))
              .attr("r", circle_size)
              .style("fill", "red");
        }
      }
      if(key === 13 && selection_made){
        console.log("user hit enter");
        if (closeGuess) {
          openMsg(true, judgementCount, currentMode);
          submittedPoints.push(target);
          closeGuess = false;
          chart.selectAll("#feed").remove();

          judgementCount += 1;
          if(judgementCount!=totalJudgements){
            document.getElementById('judgementCount').innerHTML = "Judgment "+(judgementCount+1)+" out of 40";
            if (chart.select("#last") != undefined){
              chart.select("#last").remove();
            }
            currloc = margin.left + scaleX(xyValues[0][judgementCount]);
            redLine.attr("x1", currloc)
                  .attr("x2", currloc);
            errorMargin
              .attr('x', currloc - widthOfBuffer/2)
              .attr('y', margin.top + scaleY(xyValues[1][judgementCount]) - accErrorMargin*height/3);
            buffer.attr('x', currloc-20);
            selection_made = false;
          }
          else {
            buffer.on("click", function(d){});
            d3.select(".content").selectAll("svg").remove();
            document.querySelector(".nextScenarioButton").style="display:inline"; // NextButton to quadratic
            console.log(submittedPoints);
            submitPoints(submittedPoints);
          }
        }
        else {
          openMsg(false, judgementCount, currentMode);
        }
      }
    }
  }
  document.querySelector(".nextScenarioButton").onclick = function() {
    checkStatus();
  }
}

function submitPoints(submittedPoints){
  return submittedPoints;
}

function checkStatus(){
  document.querySelector(".instructionText").innerHTML = "";
  document.querySelector(".container").innerHTML = "";

  if(currentMode.includes("train")){
      currentMode = "test";
      displayInstructions(currentMode+"-"+expCondition[0]);
      document.querySelector(".container").innerHTML = "";
      document.querySelector(".nextScenarioButton").style="display:none";
      document.querySelector("#mode").innerHTML = "Testing mode";
      presentationDict[expCondition[0]]([xyValues[0].slice(40,80),xyValues[1].slice(40,80)],currentMode,expCondition);
      //presentationDict[expCondition[0]](xyValues,mode);
  }
  else {
    finishedConditions[currentCondition] = true;
    currentCondition += 1;
    console.log(finishedConditions);
    console.log(totalNoOfConditions);
    console.log(currentCondition);
    if(currentCondition <= totalNoOfConditions){
      /* GENERATING RANDOM CONDITION*/
      console.log("-----------------------");
      var uniqueCondition = false;
      while(!uniqueCondition){
        var temp = randomCondition();
        if(expConditions.indexOf(temp[0])<0 && expConditions.indexOf(temp[1])<0){
          uniqueCondition = true;
          expCondition = temp;
          expConditions.push(expCondition[0],expCondition[1]);
        }
        else {
          uniqueCondition = false;
        }
      }
      console.log("Pres type: " + expCondition[0]);
      console.log("Function type: " + expCondition[1]);

      /* CONSTRUCTING FUNCTION'S X AND Y ARRAYS*/
      var positions = Array.apply(null, {length: 80}).map(Number.call, Number);
      var xValue = positions.map(function(x) { return x+1; });
      var yValue = xValue.map(function(x) { return functionDict[expCondition[1]](x); });
      xyValues = [xValue,yValue];

      /* DISPLAYING INSTRUCTIONS */
      currentMode = "train";
      displayInstructions(currentMode+"-"+expCondition[0]);
      document.querySelector(".container").innerHTML = "";
      document.querySelector(".nextScenarioButton").style="display:none";
      document.querySelector("#mode").innerHTML = "Training mode";
      presentationDict[expCondition[0]]([xValue.slice(0,40),yValue.slice(0,40)],currentMode,expCondition);
      //presentationDict[expCondition[0]](xyValues,mode);
    }
    else {
      thankyou();
    }
  }
}

function startExperiment(){
  document.querySelector("#mode").style="display:inline";
  document.querySelector("#mode").value="Training mode";
  document.querySelector("#judgementCount").style="display:inline";
  document.querySelector("#judgementCount").value="Judgment 1 out of 40 ";
  document.querySelector(".intro").remove();
  var parent = document.querySelector("#main");
  parent.className = "col-md-9 jumbotron vertical-center";
  var intro = document.createElement('div');
  intro.className = "container";
  parent.appendChild(intro);
  checkStatus();
}

function introduction(){
  document.querySelector("#mode").style="display:none";
  document.querySelector("#judgementCount").style="display:none";
  loadJSON('exp_input.json', function(data){
    document.querySelector(".instructionText").innerHTML = JSON.parse(data)["frontpage"];
    var intro = document.createElement('div')
    intro.className = "intro";
    var parent = document.querySelector("#main");
    parent.className = "col-md-9 jumbotron";
    parent.appendChild(intro);
    document.querySelector(".intro").innerHTML = JSON.parse(data)["consentform"];
  });
}

function thankyou(){
  document.querySelector(".container").innerHTML = "";
  document.querySelector("#judgementCount").innerHTML = "";
  document.querySelector("#mode").innerHTML = "";
  loadJSON('exp_input.json', function(data){
    document.querySelector(".instructionText").innerHTML = JSON.parse(data)["conclusion"];
  });
  document.querySelector(".nextScenarioButton").innerHTML = "Take Survey";
  document.querySelector(".nextScenarioButton").onclick = function() {
    survey();
  }
}

function survey(){}

/********  MAIN  **********/

var functionDict = {
  "linear": function(x) {return 2*x+1;},
  "quadratic": function(x) {return x*x;},
  "periodic": function(x) {return Math.sin(x*(Math.PI/180))+1;},
};

var presentationDict = {
  "bar": function(x,y,z) {barPlot(x,y,z);},
  "scatter-nomem": function(x) {scatterNoMemPlot(x);},
  "scatter-fullmem": function(x) {scatterFullMemPlot(x);}
};

/* GENERATING IDENTIFIERS*/
var sessionID = Math.random();

/* ESTABLISHING NUMBER OF CONDITIONS */
var xyValues;               // true values
var finishedConditions = [false,false,false];
var totalNoOfConditions = 3;
var currentCondition = 0;
var currentMode = "start";
const totalJudgements = 40; // experiment size
const margins = 5;          // margins of the container
const accErrorMargin = 1/5; // acceptable error margin
const debugmode = true;     // change this for debugging

var expConditions = [];
var expCondition;

introduction();
