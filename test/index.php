<!DOCTYPE html>
<head>
<title></title>
</head>
<body>
  <script src="glimr.min.js.php"></script>

  <h1 id="foo"></h1>

  <script>
    for (var i = 0; i < 10; i++) {
      Glimr.getTags("TESTCLIENTID", function(tags) {
        document.getElementById("foo").innerHTML += "Got tags: <br>[" + tags.join(", ") + "]<br>";
      });
    }
  </script>
</body>
