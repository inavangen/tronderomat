package com.inava.tronderomat;

import android.content.Context;
import android.content.res.AssetManager;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.view.Menu;
import android.view.MenuItem;
import android.content.Intent;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.HashMap;

public class TranslateActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_translate);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.menu_translate, menu);
        return true;
    }

    /*@Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();

        //noinspection SimplifiableIfStatement
        if (id == R.id.action_settings) {
            return true;
        }

        return super.onOptionsItemSelected(item);
    }*/


    /* Code for the menu (add more cases to add more options) */
    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
    switch(item.getItemId()) {
    case R.id.action_about: // The name from the Xml-file
        Intent intent = new Intent(this, Om.class); // The java class
        this.startActivity(intent);
        break;
    case R.id.action_feedback:
        Intent intent2 = new Intent(this, FeedbackActivity.class);
        this.startActivity(intent2);
        break;


    default:
        return super.onOptionsItemSelected(item);
    }
    return true;
    }


    /** Custom class: Called when the user clicks the Send button */

    // Method: Creates a hashmap of the data.txt.
    public HashMap<String, String> createHashMap(InputStream input){
        String line;
        HashMap<String, String> hmap = new HashMap<String, String>();
        try {

            BufferedReader readerH = new BufferedReader(new InputStreamReader(input));
            while ((line = readerH.readLine()) != null) {
                String [] parts = line.split(" ");
                hmap.put(parts[0].toUpperCase(), parts[1].toUpperCase());
            }
        } catch (IOException e) {
            System.out.println(e);
        }
        return hmap;
    }

    // Method: Adds spaces where necessary (if user haven't used space the right way)
    public String retrim(String phrase){
        StringBuilder new_phrase = new StringBuilder();
        String[] parts = phrase.split("");
        // Loops through every char in the phrase
        for (int i = 0; i < parts.length; i++){
            // TODO: Add functionality for more special characters
            // If at any time, the character is a special character. A space should be added.
            if(parts[i].equals(".") || parts[i].equals(",") || parts[i].equals("?") || parts[i].equals("!")|| parts[i].equals(":")){

               // If the last character in the phrase
                if(i == parts.length-1) {
                    new_phrase.append(" " + parts[i]);

                // Else check where it is located and trim accordingly
                } else {
                    // If next char is a space. Ex "Fisk. "
                    if (parts[i + 1].equalsIgnoreCase(" ")) {
                        //System.out.println("IF");
                        new_phrase.append(" "+parts[i]); //This one is a bit strange

                    // If next char is another special
                    } else if (parts[i + 1].equals(".") || parts[i+1].equals(",") || parts[i+1].equals("?") || parts[i+1].equals("!")|| parts[i+1].equals(":")){
                        //System.out.println("ELIF");
                        new_phrase.append(" " + parts[i]);

                    // Else, force add space
                    } else {
                        //System.out.println("ELSE");
                        new_phrase.append(" " + parts[i] + " ");
                    }
                }
            // Else normal characters
            } else {
                new_phrase.append(parts[i]);
            }
        }
        System.out.println(new_phrase.toString());
        return new_phrase.toString();
    }

    // Method: Scans one word for special character and treats it. Return (new) word
    public String scan_word(String word){
        String str_new_word = word;
        String[]parts = word.split("");
        int len = parts.length-1;

        // If last character is a special character
        if(parts[len].equals(".") || parts[len].equals(",") || parts[len].equals("?") || parts[len].equals("!")|| parts[len].equals(":")){
            StringBuilder new_word = new StringBuilder();
            // Append all except last
            for (int i = 0; i<len+1; i++){
                new_word.append(parts[i]);
            }
            return word;
            //return new_word.toString();
        }
        return str_new_word;
    }

    // Method: Handles the input message (main-ish).
    public void sendMessage(View view){

        /* This parts removes the touch-keyboard when the "Oversett"
        button is pushes so that you don't manually have to remove it */
        LinearLayout mainLayout;
        // Gets (Linear)layout fom content_translate.xml
        mainLayout = (LinearLayout)findViewById(R.id.translate_layout);
        // Then just use the following:
        InputMethodManager imm = (InputMethodManager)getSystemService(Context.INPUT_METHOD_SERVICE);
        imm.hideSoftInputFromWindow(mainLayout.getWindowToken(), 0);


        //Intent intent = new Intent(this, DisplayMessageActivity.class);
        //Retrieves data from xml text field
        EditText editText = (EditText) findViewById(R.id.edit_message);
        // Converts to string
        String message = editText.getText().toString();

        // Creates a asset manager to maintain data from asset folder (app/src/main/assets)
        AssetManager assetManager = getAssets();
        BufferedReader reader = null;
        InputStream input;
        String text = "";

        // Opens and reads the data.txt file.
        try {
            input = assetManager.open("data.txt");
            // Reads line by line
            StringBuilder stringbuilder = new StringBuilder();

            // Check if editText is in the data, and change if so
            String phrase = editText.getText().toString();

            // Retrims phrase for appropriate spacing. See method
            phrase = retrim(phrase);
            String phrase_parts[] = phrase.split(" ");
            HashMap<String, String> hmap = createHashMap(input);

            // For each word in the phrase
            for (int i = 0; i < phrase_parts.length; i++) {
                input.reset(); // Need to reset the input stream
                phrase_parts[i] = scan_word(phrase_parts[i]); // Scans the word. See method

                // Searches hashmap
                if (phrase_parts[i] != null){
                    String new_word = hmap.get(phrase_parts[i].toUpperCase());
                    // If the scan method did not change the function
                    if (new_word != null){
                        stringbuilder.append(new_word + " ");
                    } else {
                        stringbuilder.append(phrase_parts[i] + " ");
                    }
                }
            }
            text = stringbuilder.toString();

        } catch (IOException e) {
            System.out.println(e);
        } finally {
            if (reader != null) {
                try {
                    reader.close();
                } catch (IOException ex) {
                    System.out.println(ex);
                }
            }
        }
        message = text;
        // Un-commment below to allow new activity
        //intent.putExtra(EXTRA_MESSAGE, message);
        //startActivity(intent); // Starts new activity
        TextView textView = new TextView(this);
        textView = (TextView)findViewById(R.id.result);
        textView.setText(message.toUpperCase());

    }
}
