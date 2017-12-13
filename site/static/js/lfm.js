$(document).ready(function() {

  var form_action="https://lfm.webscript.io/contactform";
  // var form_action="https://us-central1-lexington-friends.cloudfunctions.net/contactform";

  add_a_names()

  $("#messageSubmit").click(function() {
    //clear any errors
    contactForm.clearErrors();
 
    //do a little client-side validation -- check that each field has a value and e-mail field is in proper format
    var hasErrors = false;
    $("#contactForm input,textarea").each(function() {
      if ($(this).hasClass("optional")) {
        return;
      }
      if (!$(this).val()) {
        hasErrors = true;
        contactForm.addError($(this));
      }
    });

    var $email = $('#email');
    if (!contactForm.isValidEmail($email.val())) {
      hasErrors = true;
      contactForm.addError($email);
    }

    var $phone = $('#phone');
    if ($phone.val()) {
      if (!contactForm.isValidPhone($phone.val())) {
        hasErrors = true;
        contactForm.addError($phone);
      }
    }
 
    //if there are any errors return without sending e-mail
    if (hasErrors) {
      return false;
    }
 
    //send the feedback e-mail
    $.ajax({
      type: "POST",
      url: form_action,
      data: $("#contactForm").serialize(),
      success: function(response)
      {
        contactForm.addAjaxMessage("Thanks for contacting us!", false);
        $("#contactForm").find("input[type=text], input[type=email], input[type=tel], textarea").val("");
      },
      error: function(response)
      {
        var err = response.responseText;
        if ( ! err ) {
          err = "An error occurred";
        }
        contactForm.addAjaxMessage(err, true);
      }
   });
    return false;
  }); 
});
 
//namespace as not to pollute global namespace
var contactForm = {
  isValidEmail: function (email) {
    var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(email);
  },
  isValidPhone: function (phone_number) {
    var num_digits = (phone_number.match(/\d/g)||[]).length 
    if (num_digits >=7) {
      return true;
    } else {
      return false;
    }
  },
  clearErrors: function () {
    $('#emailAlert').remove();
    $('#contactForm .help-block').hide();
    $('#contactForm .form-group').removeClass('has-error');
  },
  addError: function ($input) {
    $input.siblings('.help-block').show();
    $input.parent('.form-group').addClass('has-error');
  },
  addAjaxMessage: function(msg, isError) {
    $("#contactResult").replaceWith('<div class="alert alert-' + (isError ? 'danger' : 'success') + '">' + $('<div/>').text(msg).html() + '</div>');
  }
};

// toc markup produced headers with an id like "name:doc_id". this function
// prepends a <a name="name"></a> element, allowing for friendlier / permanent
// urls to be shared.
var add_a_names = function() {
  $("h1,h2").each(function(i,el){
    var name = $(el).attr("id");
    if (name) {
      var idx = name.indexOf(":");
      if (idx != -1) {
        var a_name = name.substring(0,idx);
        var a = document.createElement('a');
        $(a).attr("name",a_name);
        $(el).prepend(a);
      }
    }
  });
};
