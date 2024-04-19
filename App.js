import {StatusBar} from 'expo-status-bar';
import {Button, StyleSheet, Text, View} from 'react-native';
import * as SQLite from "expo-sqlite";
import React, {useEffect, useRef} from "react";

async function openDatabase(pathToDatabaseFile) {
  // if (!(await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'SQLite')).exists) {
  //   await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'SQLite');
  // }
  // const asset = await Asset.fromModule(require(pathToDatabaseFile)).downloadAsync();
  // await FileSystem.copyAsync({
  //   from: asset.localUri,
  //   to: FileSystem.documentDirectory + 'SQLite/myDatabaseName.db',
  // });
  return SQLite.openDatabase('test.db');
}

export default function App() {

  const db = useRef(null);

  useEffect(() => {
    void (async () => {
      db.current = await openDatabase();
    })();
  }, []);

  const generateRandomCoordinates = async () => {
    return new Promise((resolve, reject) => {
      db.current.transaction(tx => {
        console.log('START GENERATE')
        tx.executeSql('CREATE TABLE IF NOT EXISTS coordinates (id INTEGER PRIMARY KEY AUTOINCREMENT, x REAL, y REAL, assetId INTEGER);');
        for (let i = 0; i < 1000000; i++) {
          const x = Math.random() * 100; // Modify range as needed
          const y = Math.random() * 100; // Modify range as needed
          const assetId = String(i)
          tx.executeSql('INSERT INTO coordinates (x, y, assetId) VALUES (?, ?, ?)', [x, y, assetId], (_, resultSet) => {
          }, (_, error) => {
            console.log('ERROR GENERATE', error)
            reject(error)
          });
        }
      }, null, resolve);
    });
  };

  const countCoordinates = async () => {
    return new Promise((resolve, reject) => {
      db.current.transaction(tx => {
        tx.executeSql('SELECT COUNT(*) AS record_count FROM coordinates;', [], (_, {rows}) => {
          console.log('COUNT', rows._array[0].record_count)
          resolve(rows._array[0].record_count);
        }, (_, error) => reject(error));
      }, null, error => reject(error));
    });
  };

  const searchCoordinatesInRange = async (minX, maxX, minY, maxY) => {
    console.log('START SEARCH', new Date());
    return new Promise((resolve, reject) => {
      db.current.transaction(tx => {
        tx.executeSql('SELECT * FROM coordinates WHERE x BETWEEN ? AND ? AND y BETWEEN ? AND ?;', [minX, maxX, minY, maxY], (_, {rows}) => {
          console.log('SEARCH', rows._array.length);
          console.log('SEARCH SAMPLES', rows._array.slice(0, 10));
          console.log('END SEARCH', new Date());
          resolve(rows._array);
        }, (_, error) => reject(error));
      }, null, error => reject(error));
    });
  };

  const clear = async () => {
    try {
      await db.current.closeAsync()
      await db.current.deleteAsync()
    } catch (e) {
      console.log(e)
    }
  }

  return (<View style={styles.container}>
    <Text>Open up App.js to start working on your app!</Text>
    <StatusBar style="auto" />
    <Button
      title={'GENERATE'}
      onPress={() => generateRandomCoordinates()}
    />
    <Button
      title={'COUNT'}
      onPress={() => countCoordinates()}
    />
    <Button
      title={'SEARCH'}
      onPress={() => searchCoordinatesInRange(10, 40, 10, 40)}
    />
    {/*<Button*/}
    {/*  title={'CLEAR'}*/}
    {/*  onPress={() => clear()}*/}
    {/*/>*/}
  </View>)
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
});
