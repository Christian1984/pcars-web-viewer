(function() {
  let server = 'localhost';
  let port = '8080';
  let uri = '/crest/v1/api';

  let pollingDelay = 1000;
  var intervalId = undefined;
  var requestId = 0;

  var results = [];
  let posData = {};
  
  function log(msg) {
    $('#status').text(msg);
  }

  function random255() {
    return Math.floor(Math.random() * 256);
  }

  function randomRgbString() {
    return 'rgb(' + random255() + ', ' + random255() + ', ' + random255() + ')';
  }

  function updateResults(data) {
    //store raw data (for debugging)
    results.push(data);
    $('#resultsSize').text(results.length);

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
        
        series.data.push(participants[i].mRacePosition);
      }
    }
  }

  function dumpResults() {
    $("#resultsArrayDump").text(JSON.stringify(results, null, 4));
    $("#chartistSourceArrayDump").text(JSON.stringify(posData, null, 4));
  }

  function loadSampleResults() {
    results = sampleRawDataArray;
    posData = samplePosData;
    dumpResults();
  }

  function drawChart() {
    var ctx = document.getElementById('posChartCanvas').getContext('2d');
    var chart = new Chart(ctx, {
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
            }
        }
        }
    });
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
        updateResults(data);
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
    $("#drawChart").click(() => drawChart());

    posData.time = [];
    posData.series = [];
  });
})();