import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as SQLite from "expo-sqlite";


SplashScreen.preventAutoHideAsync();
setTimeout(SplashScreen.hideAsync, 2000);

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => { },
        };
      },
    };
  }
  const db = SQLite.openDatabase("bmiDB.db");
  return db;
}

const db = openDatabase();

function Results() {
  const [results, setResults] = useState(null)

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(`select id, weight, height, bmi, date(inputDate) as Date from results order by Date desc`, [], (_, { rows: { _array } }) => {
        setResults(_array);
      })
    })
  }, []);

  if (results === null || results.length === 0) {
    return null;
  }

  return (
    <View>
      {results.map(({ id, weight, height, bmi, Date }) => (
        <Text key={id} style={styles.assessment}>
          {Date}: {bmi} (W:{weight}, H:{height})
        </Text>
      ))}
    </View>
  )
}

function assessBMI(bmi) {
  if (bmi < 18.5) {
    return "(Underweight)";
  }
  else if (bmi >= 18.5 && bmi < 25) {
    return "(Healthy)";
  }
  else if (bmi >= 25 && bmi < 30) {
    return '(OverWeight)';
  }
  else if (bmi >= 30) {
    return '(Obese)';
  }
  else {
    return '';
  }
}

export default function App() {
const [weight, setWeight] = useState(null);
    const [height, setHeight] = useState(null);
    const [text, setText] = useState(null);
    const [forceUpdate, setforceUpdate] = useState(null); 
  

  useEffect(() => {
    db.transaction((tx) => {
      // tx.executeSql(
      //   "drop table results;"
      // )
      tx.executeSql(
        "create table if not exists results(id integer primary key not null, weight integer, height integer, bmi decimal(18,2), inputDate real);"
      );
    });
  }, []);
  
  const calculateBMI = (weight, height, setText) =>{
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const value = (w / (h * h)) * 703;
    let assessment = assessBMI(value);
    setText(`Body Mass Index is ${value.toFixed(1)}` + "\n" + `${assessment}`);
    add(weight, height, value.toFixed(1))
  }

  const add = async (weight, height, value) =>{
    db.transaction((tx) => {
      const parsedWeight = parseInt(weight);
      const parsedHeight = parseInt(height);
      const parsedBMI = parseFloat(value);
      tx.executeSql(
        "insert into results (weight, height, bmi, inputDate) values (?, ?, ?, julianday('now'))",
        [parsedWeight, parsedHeight, parsedBMI],
        () => {setforceUpdate(!forceUpdate);}
      );
    })
  }
    

    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.toolbar}>BMI Calculator</Text>
        <ScrollView>
          <TextInput
            style={styles.input}
            onChangeText={(text)=> setWeight(text)}
            value={weight}
            keyboardType='numeric'
            placeholder='Weight in Pounds'>
          </TextInput>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setHeight(text) }
            value={height}
            keyboardType='numeric'
            placeholder={height ? height : 'Height in Inches'}
          />
          <Pressable onPress={ () => {
            calculateBMI(weight, height, setText);
            }} style={styles.button}><Text style={styles.buttonText}>Compute BMI</Text></Pressable>
            {/*<Pressable onPress={() => 
              db.transaction(
                (tx) => {
                  tx.executeSql('drop table results;'),
                  () => {setforceUpdate(!forceUpdate);}
                }
              )} style={styles.button}><Text style={styles.buttonText}>Drop Table</Text>
            </Pressable> */}
          <TextInput
            style={styles.content}
            editable={false}
            value={text || ""}
            multiline={true}
          ></TextInput>
          <Text style={styles.assessmentHeader}>BMI History</Text>
          <Results key={forceUpdate} setforceUpdate ={setforceUpdate} style={styles.assessment} />
        </ScrollView>
      </SafeAreaView>
    );
  }


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 0,
    padding: 5,
  },
  toolbar: {
    backgroundColor: '#f4411e',
    color: '#fff',
    textAlign: 'center',
    padding: 25,
    fontSize: 28,
    fontWeight: 'bold'
  },
  content: {
    textAlign: 'center',
    fontSize: 28,
    flex: 1,
    marginTop: 50,
    marginBottom: 50,
    color: '#000'
  },
  preview: {
    backgroundColor: '#bdc3c7',
    flex: 1,
    height: 500,
  },
  input: {
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    height: 40,
    padding: 5,
    marginLeft: 10,
    marginRight: 10,
    marginTop: 10,
    flex: 1,
    fontSize: 24,
  },
  button: {
    backgroundColor: '#34495e',
    margin: 10,
    borderRadius: 2,
    padding: 10,
  },
  assessmentHeader: {
    fontSize: 24,
    color: '#000'
  },
  assessment: {
    fontSize: 20,
    color: "#000"
  },
  buttonText: {
    fontSize: 24,
    color: 'white',
    textAlign: 'center',
  }
});
