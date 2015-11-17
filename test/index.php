<!DOCTYPE html>
<head>
<title></title>
</head>
<body>
  <script src="glimr.min.js.php"></script>

  <h1 id="foo1"></h1>
  <hr>
  <h1 id="foo2"></h1>

  <script>
    "use strict";

    for (let i = 0; i < 10; i++) {
      Glimr.getTags("TESTCLIENTID", function(tags) {
        document.getElementById("foo1").innerHTML += i + "<br>Got tags: <br>[" + tags.join(", ") + "]<br>";

        Glimr.getTags("TESTCLIENTID", function(tags) {
          document.getElementById("foo1").innerHTML += i + ".2<br>Got tags: <br>[" + tags.join(", ") + "]<br>";
        });
      });
    }

    for (let i = 0; i < 1; i++) {
      Glimr.getTags("TESTCLIENTID2", function(tags) {
        document.getElementById("foo2").innerHTML += i + "<br>Got tags: <br>[" + tags.join(", ") + "]<br>";

        Glimr.getTags("TESTCLIENTID2", function(tags) {
          document.getElementById("foo1").innerHTML += i + ".2<br>Got tags: <br>[" + tags.join(", ") + "]<br>";
        });
      });
    }
  </script>
</body>
