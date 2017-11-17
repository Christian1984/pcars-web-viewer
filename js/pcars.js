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
    console.log(msg);
    $('#status').text(msg);
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
        if (posData.series.length <= i) {
          posData.series.push([]);
        }
        
        posData.series[i].push(participants[i].mRacePosition);
      }
    }
  }

  function dumpResults() {
    $("#resultsArrayDump").text(JSON.stringify(results, null, 4));
    $("#chartistSourceArrayDump").text(JSON.stringify(posData, null, 4));

    console.log("posData.time.length", posData.time.length);
    console.log("posData.series.length", posData.series.length);
    console.log("posData.series[0].length", posData.series[0].length);
  }

  function loadSampleResults() {
    results = sampleArray;
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
            labels: ["January", "February", "March", "April", "May", "June", "July"],
            datasets: [{
                label: "My First dataset",
                //backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: [0, 10, 5, 2, 20, 30, 45],
            }]
        },
    
        // Configuration options go here
        options: {}
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
        console.log(data);
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