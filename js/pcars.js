(function() {
  let server = 'localhost';
  let port = '8080';
  let uri = '/crest/v1/api';

  let pollingDelay = 1000;
  var intervalId = undefined;
  var requestId = 0;
  
  function log(msg) {  
    console.log(msg);
    $('#status').text(msg);
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

    params = undefined;
    //params = 'buildInfo=true';

    log('Sending Request ' + id + '...');
    $.ajax({
      url: 'http://' + server + ':' + port + uri + (params ? '?' + params : ''),
      async: true,
      error: (jqXHR, status, error) => log('Request ' + id + ': An Error occured! Status: ' + status + ', Message: ' + error),
      success: (data, textStatus, jqXHR) => {
        log('Request ' + id + ': Response received, Status: ' + textStatus);
        $('#response').text(JSON.stringify(data, null, 4));
        console.log(data);
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
    })
  });
})();