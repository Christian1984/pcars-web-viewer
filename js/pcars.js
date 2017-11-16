(function() {
  let server = 'localhost';
  let port = '8080';
  let uri = '/crest/v1/api';
  
  function log(msg) {  
    console.log(msg);
    $('#status').text(msg);
  }
  
  function sendRequest() {
    // fire a request against the api, docs at
    // https://github.com/NLxAROSA/CREST/tree/master

    params = undefined;
    //params = 'buildInfo=true';

    $.ajax({
      url: 'http://' + server + ':' + port + uri + (params ? '?' + params : ''),
      async: true,
      error: (jqXHR, status, error) => log('An Error occured! Status: ' + status + ', Message: ' + error),
      success: (data, textStatus, jqXHR) => {
        log('Response received, Status: ' + textStatus);
        $('#response').text(JSON.stringify(data, null, 4));
        console.log(data);
      }
    });
  }

  $(document).ready(() => {
    $('#fireAjax').click(function() {
      log('Sending Request...');
      sendRequest();
    });
  });
})();