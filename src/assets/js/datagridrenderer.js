//
//  DataGridRenderer.js
//  Part of Mr-Data-Converter
//
//  Created by Shan Carter on 2010-10-18.
//

var DataGridRenderer = {

  //---------------------------------------
  // HTML Table
  //---------------------------------------

  html: function (dataGrid, headerNames, headerTypes, indent, newLine) {
    //inits...
    var commentLine = "<!--";
    var commentLineEnd = "-->";
    var outputText = "";
    var numRows = dataGrid.length;
    var numColumns = headerNames.length;

    //begin render loop
    outputText += "<table>"+newLine;
    outputText += indent+"<thead>"+newLine;
    outputText += indent+indent+"<tr>"+newLine;

    for (var j=0; j < numColumns; j++) {
      outputText += indent+indent+indent+'<th class="'+headerNames[j]+'-cell">';
      outputText += headerNames[j];
      outputText += '</th>'+newLine;
    };
    outputText += indent+indent+"</tr>"+newLine;
    outputText += indent+"</thead>"+newLine;
    outputText += indent+"<tbody>"+newLine;
    for (var i=0; i < numRows; i++) {
      var row = dataGrid[i];
      var rowClassName = ""
      if (i === numRows-1) {
        rowClassName = ' class="lastRow"';
      } else if (i === 0){
        rowClassName = ' class="firstRow"';
      }
      outputText += indent+indent+"<tr"+rowClassName+">"+newLine;
      for (var j=0; j < numColumns; j++) {
        outputText += indent+indent+indent+'<td class="'+headerNames[j]+'-cell">';
        outputText += row[j]
        outputText += '</td>'+newLine
      };
      outputText += indent+indent+"</tr>"+newLine;
    };
    outputText += indent+"</tbody>"+newLine;
    outputText += "</table>";

    return outputText;
  },

  //---------------------------------------
  // Textile table
  //---------------------------------------

  txtable: function (dataGrid, headerNames, headerTypes, indent, newLine) {
    //inits...
    var outputText = "";
    var numRows = dataGrid.length;
    var numColumns = headerNames.length;
    var indent = "";

    // header row
    if (headerNames[0] != "val0") {
      outputText += "|^." + newLine;
      outputText += indent+"|";
      for (var j=0; j < numColumns; j++) {
        outputText += "_. " + headerNames[j];
        if (j < (numColumns-1)) {outputText+=" |"};
      };
      outputText += " |" + newLine;
      outputText += "|-." + newLine;
    }

    //begin render loop
    for (var i=0; i < numRows; i++) {
      outputText += indent+"| ";
      for (var j=0; j < numColumns; j++) {
        outputText += dataGrid[i][j];
        if (j < (numColumns-1)) {outputText+=" | "};
      };
      outputText += " |" + newLine;
    }

    return outputText;
  }

};
