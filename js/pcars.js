(function() {
  let server = 'localhost';
  let port = '8080';
  let uri = '/crest/v1/api';

  let pollingDelay = 1000;
  var intervalId = undefined;
  var requestId = 0;

  let posData = {};

  var resultIndex = 0;
  var results = [];

  var chart = undefined;
  
  function log(msg) {
    $('#status').text(msg);
  }

  function addLeadingZero(val) {
    return val < 10 ? `0${val}` : val;
  }
  
  function getTimerStringFromSeconds(seconds) {

    let hh = addLeadingZero(~~(seconds / 3600));
    let mm = addLeadingZero(~~((seconds % 3600) / 60));
    let ss = addLeadingZero(~~(seconds % 60));

    return `${hh}:${mm}:${ss}`;
  }

  function random255() {
    return Math.floor(Math.random() * 256);
  }

  function randomRgbString() {
    return 'rgb(' + random255() + ', ' + random255() + ', ' + random255() + ')';
  }

  function updateResults(data, updateRaw = false) {
    //store raw data (for debugging)

    if (updateRaw) {
      results.push(data);
      $('#resultsSize').text(results.length);
    }

    //store data for charts
    let time = data.timings.mCurrentTime;

    if (time >= 0 && !posData.time.includes(time)) {
      posData.time.push(time);

      let participants = data.participants.mParticipantInfo;
      
      for (var i = 0; i < participants.length; i++) {
        let driverName = participants[i].mName;
        var series = posData.series.find(series => series.label == driverName);

        if (!series) {
          series = {
            label: driverName,
            //backgroundColor: 'rgba(0,0,0,0)',
            borderColor: randomRgbString(),
            data: []
          };

          posData.series.push(series);
        }
        
        series.data.push(-participants[i].mRacePosition);
      }

      //update chart
      if (!chart) {
        initChart();
      }
      else {
        updateChart();
      }
    }
  }

  function dumpResults() {
    $("#resultsArrayDump").text(JSON.stringify(results, null, 4));

    //cleanup when recorded data from test array
    posData.series.forEach((e) => {
      delete e._meta;
    });
    $("#chartistSourceArrayDump").text(JSON.stringify(posData, null, 4));
  }

  function loadSampleResults() {
    results = sampleRawDataArray;
    posData = samplePosData;
  }

  function initChart() {
    var ctx = document.getElementById('posChartCanvas').getContext('2d');
    chart = new Chart(ctx, {
        // The type of chart we want to create
        type: 'line',
    
        // The data for our dataset
        data: {
            labels: posData.time,
            datasets: posData.series
        },
    
        // Configuration options go here
        options: {
          elements: {
            point: {
              radius: 0
            },
            line: {
              backgroundColor: 'rgba(0,0,0,0)',
              tension: 0
            }
        },
        scales: {
          xAxes: [{
            ticks: {
              stepSize: 1,
              callback: function(tickValue, index, ticks) {
                return getTimerStringFromSeconds(tickValue);
              }
            }
          }],
          yAxes: [{
            ticks: {
              stepSize: 1,
              beginAtZero: true,
              suggestedMin: -posData.series.length - 1,
              callback: function(tickValue, index, ticks) {
                if (tickValue === 0) {
                  return '';
                }

                return -tickValue;
              }
            }
          }]
        },
        // Container for pan options
        pan: {
            // Boolean to enable panning
            enabled: true,

            // Panning directions. Remove the appropriate direction to disable 
            // Eg. 'y' would only allow panning in the y direction
            mode: 'x'
        },

        // Container for zoom options
        zoom: {
            // Boolean to enable zooming
            enabled: true,

            // Zooming directions. Remove the appropriate direction to disable 
            // Eg. 'y' would only allow zooming in the y direction
            mode: 'x',
            sensitivity: 0.1,
            velocity: 5
        }
      }
    });
  }

  function updateChart() {
    chart.update();
  }

  function recordDataFromSampleData() {
    posData = {time: [], series: []};
    initChart();

    resultIndex = 0;

    var interval = setInterval(() => {
      if (resultIndex < results.length) {
        updateResults(results[resultIndex], false);
        resultIndex++;
      }
      else {
        clearInterval(interval);
      }
    }, pollingDelay / 100);
  }

  function startPolling() {
    if (!intervalId) {      
      sendRequest();
      intervalId = setInterval(() => {
        sendRequest();
      }, pollingDelay);
    }
  }

  function stopPolling() {
    clearInterval(intervalId);
    intervalId = undefined;
  }

  function sendRequest() {
    requestId++;
    sendAjaxRequest(requestId);
  }
  
  function sendAjaxRequest(id) {
    // fire a request against the api, docs at
    // https://github.com/NLxAROSA/CREST/tree/master

    //params = undefined;
    params = 'participants=true&eventInformation=true&timings=true';

    log('Sending Request ' + id + '...');
    $.ajax({
      url: 'http://' + server + ':' + port + uri + (params ? '?' + params : ''),
      async: true,
      error: (jqXHR, status, error) => log('Request ' + id + ': An Error occured! Status: ' + status + ', Message: ' + error),
      success: (data, textStatus, jqXHR) => {
        log('Request ' + id + ': Response received, Status: ' + textStatus);
        $('#response').text(JSON.stringify(data, null, 4));
        updateResults(data, true);
      }
    });
  }

  $(document).ready(() => {
    $('#fireAjax').click(() => {
      sendRequest();
    });

    $('#startPolling').click(() => {
      $('#startPolling').prop('disabled', true);
      $('#stopPolling').prop('disabled', false);
      startPolling();
    });

    $('#stopPolling').click(() => {
      $('#startPolling').prop('disabled', false);
      $('#stopPolling').prop('disabled', true);
      stopPolling();
    });

    $("#dumpResultsArray").click(() => dumpResults());  
    $("#loadSampleResultsArray").click(() => loadSampleResults());
    $("#drawChart").click(() => initChart());
    $("#updateChart").click(() => updateChart());
    $('#recFromArray').click(() => recordDataFromSampleData());

    posData.time = [];
    posData.series = [];

    loadSampleResults(); //only for testing!
    initChart();
  });
})();