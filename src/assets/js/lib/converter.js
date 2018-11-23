//  converter.js
//  Mr-Data-Converter
//  Created by Shan Carter on 2010-09-01.

//---------------------------------------
// PUBLIC PROPERTIES
//---------------------------------------

function DataConverter(nodeId) {
    this.nodeId                 = nodeId;
    this.node                   = $("#"+nodeId);
    this.outputDataTypes        = [
                                    {"text":"Textile", "id":"txtable", "notes":""},
                                    {"text":"HTML", "id":"html", "notes":""}
                                ];
    this.outputDataType         = "txtable";
    this.columnDelimiter        = "\t";
    this.rowDelimiter           = "\n";
    this.inputTextArea          = {};
    this.outputTextArea         = {};
    this.inputHeader            = {};
    this.outputHeader           = {};
    this.dataSelect             = {};
    this.inputText              = "";
    this.outputText             = "";
    this.newLine                = "\n";
    this.indent                 = "  ";
    this.commentLine            = "//";
    this.commentLineEnd         = "";
    this.tableName              = "MrDataConverter";
    this.useUnderscores         = true;
    this.headersProvided        = true;
    this.downcaseHeaders        = true;
    this.upcaseHeaders          = false;
    this.includeWhiteSpace      = true;
    this.useTabsForIndent       = false;
}

//---------------------------------------
// PUBLIC METHODS
//---------------------------------------

DataConverter.prototype.create = function(w,h) {
    var self = this;

    // build HTML for converter
    this.inputHeader = $('<p>Input CSV or tab-delimited data. Using Excel? Simply copy and paste. No data on hand? <a href="#" id="insertSample">Use sample</a>.</p>');
    this.inputTextArea = $('<label for="dataInput">Input</label> <textarea id="dataInput" rows="8" cols="64"></textarea>');
    var outputHeaderText = '<p><label for="dataSelector">Format as</label> <select id="dataSelector">';

    for (var i=0; i < this.outputDataTypes.length; i++) {
        outputHeaderText += '<option value="' + this.outputDataTypes[i].id + '" ' + (this.outputDataTypes[i].id === this.outputDataType ? 'selected="selected"' : '') + '>' + this.outputDataTypes[i].text + '</option>';
    }

    outputHeaderText += '</select></p>';

    this.outputHeader = $(outputHeaderText);
    this.outputTextArea = $('<label for="dataOutput">Output</label> <textarea id="dataOutput" rows="8" cols="64" readonly></textarea>');

    this.node.append(this.inputHeader);
    this.node.append(this.inputTextArea);
    this.node.append(this.outputHeader);
    this.node.append(this.outputTextArea);

    this.dataSelect = this.outputHeader.find("#dataSelector");
    this.outputTextArea.click(function(evt){this.select();});


    $("#insertSample").bind('click',function(evt) {
        evt.preventDefault();
        self.insertSampleData();
        self.convert();
    });

    $("#dataInput").keyup(function() {
        self.convert();
    });

    $("#dataInput").change(function() {
        self.convert();
    });

    $("#dataSelector").bind('change',function(evt) {
       self.outputDataType = $(this).val();
       self.convert();
    });

    this.resize(w,h);
};

DataConverter.prototype.resize = function(w,h) {
    var paneWidth = w;
    var paneHeight = (h-90)/2-20;

    this.node.css({width:paneWidth});
    this.inputTextArea.css({width:paneWidth-20,height:paneHeight});
    this.outputTextArea.css({width: paneWidth-20, height:paneHeight});
};

DataConverter.prototype.convert = function() {
    this.inputText = this.inputTextArea.val();
    this.outputText = "";

    //make sure there is input data before converting...
    if (this.inputText.length > 0) {
        if (this.includeWhiteSpace) {
            this.newLine = "\n";
        } else {
            this.indent = "";
            this.newLine = "";
        }

        CSVParser.resetLog();
        var parseOutput = CSVParser.parse(this.inputText, this.headersProvided, this.delimiter, this.downcaseHeaders, this.upcaseHeaders);
        var dataGrid = parseOutput.dataGrid;
        var headerNames = parseOutput.headerNames;
        var headerTypes = parseOutput.headerTypes;
        var errors = parseOutput.errors;

        this.outputText = DataGridRenderer[this.outputDataType](dataGrid, headerNames, headerTypes, this.indent, this.newLine);
        this.outputTextArea.val(errors + this.outputText);
    } //end test for existence of input text
};

DataConverter.prototype.insertSampleData = function() {
    this.inputTextArea.val("NAME\tVALUE\tCOLOR\tDATE\nAlan\t12\tblue\tSep. 25, 2009\nShan\t13\t\"green\tblue\"\tSep. 27, 2009\nJohn\t45\torange\tSep. 29, 2009\nMinna\t27\tteal\tSep. 30, 2009");
};
