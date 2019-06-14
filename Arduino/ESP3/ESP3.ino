#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <string.h>
#include <stdio.h>
#include <ArduinoJson.h>
#define ssid "Mai Dieu Ly"
#define password "0962481666"
#define mqtt_server "192.168.1.69"
#define mqtt_topic_pub "Wifi-data"
#define mqtt_topic_sub "Wifi-command"
#define mqtt_user ""
#define mqtt_pwd ""
const uint16_t mqtt_port = 1883;
WiFiClient espClient;
PubSubClient client(espClient);
int Analogvalue;
float Voltage;
int i;
int x;
char dname[10];
char dcmd[10];
char data[10] = "led off";
unsigned long count;
void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  pinMode(D1, OUTPUT);
  pinMode(D2, OUTPUT);
  pinMode(D5, OUTPUT);
  pinMode(D6, OUTPUT);
}

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* payload, unsigned int length) {
  digitalWrite(D5, HIGH);
  delay(100);
  digitalWrite(D5, LOW);
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  for (int i = 12; i < 16 ; i++) {
    dname[i - 12] = (char)payload[i];
  }
  Serial.println(dname);
  if (!strcmp(dname, "ESP3"))
  { for (int i = 21; i < 23 ; i++) {
      dcmd[i - 21] = (char)payload[i];
    }
    Serial.println(dcmd);
    if (!strcmp(dcmd, "re")) {
      digitalWrite(D1, HIGH);
      Serial.println("red on");
      strcpy(data, "red on");
      digitalWrite(D2, LOW);
      digitalWrite(D6, LOW);
    }
    if (!strcmp(dcmd, "bl")) {
      digitalWrite(D6, HIGH);
      Serial.println("blue on");
      strcpy(data, "blue on");
      digitalWrite(D1, LOW);
      digitalWrite(D2, LOW);
    }
    if (!strcmp(dcmd, "gr")) {
      digitalWrite(D2, HIGH);
      Serial.println("green on");
      strcpy(data, "green on");
      digitalWrite(D6, LOW);
      digitalWrite(D1, LOW);
    }
    if (!strcmp(dcmd, "of")) {
      digitalWrite(D1, LOW);
      digitalWrite(D2, LOW);
      digitalWrite(D6, LOW);
      Serial.println("led off");
      strcpy(data, "led off");
    }
  }
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ESP8266Client3", mqtt_user, mqtt_pwd)) {
      Serial.println("connected");
      client.subscribe(mqtt_topic_sub);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}
void loop() {
  if (!client.connected()) {
    reconnect();
  }
  for ( i = 0; i < 55; i++) {
    client.loop();
    delay(1000);
    Analogvalue = analogRead(A0);
    Voltage = Voltage + Analogvalue;
  }

  Voltage = Voltage * 3.0735 / 1023 * 2.714286 / 55;
  int a = (int(Voltage * 1000));
  Voltage = float(a) / 1000;
  Serial.println(Voltage);
  count = millis();

  StaticJsonBuffer<300> JSONbuffer;
  JsonObject& JSONencoder = JSONbuffer.createObject();
  JSONencoder["device"] = "ESP3";
  JSONencoder["user"] = "duy";
  JSONencoder["time"] = count;
  JSONencoder["voltage"] = Voltage;
  JSONencoder["prob"] = data;
  char JSONmessageBuffer[300];

  JSONencoder.printTo(JSONmessageBuffer, sizeof(JSONmessageBuffer));
  //Serial.println("Sending message to MQTT topic..");
  //Serial.println(JSONmessageBuffer);
  if (!client.connected()) {
    reconnect();
  }
  if (client.publish(mqtt_topic_pub, JSONmessageBuffer) == true) {
    //Serial.println("Success sending message");
  } else {
    Serial.println("Error sending message");
  }

  client.subscribe(mqtt_topic_sub);
  Voltage = 0;
}
