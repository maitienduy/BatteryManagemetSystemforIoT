#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Adafruit_Sensor.h>
#define ssid "Mai Dieu Ly"
#define password "0962481666"
#define mqtt_server "192.168.1.69"
#define mqtt_topic_pub "Wifi-data"
#define mqtt_topic_sub "Wifi-command"
#define mqtt_user ""
#define mqtt_pwd ""
const uint16_t mqtt_port = 1883;
WiFiClient WemosClient;
PubSubClient client(WemosClient);
int Analogvalue;
float Voltage;
int i;
char dname[10];
char dcmd[10];
char dcmd1[10];
int interval;
unsigned long count;
const int dhtPin = 4;
const int dhtType = DHT22;
DHT dht( dhtPin, dhtType);
void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  dht.begin();
  interval = 30;
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
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  for (int i = 12; i < 19 ; i++) {
    dname[i - 12] = (char)payload[i];
  }
  if (!strcmp(dname, "WemosD1"))
  { for (int i = 20; i < 28 ; i++) {
      dcmd[i - 20] = (char)payload[i];
    }
    if (!strcmp(dcmd, "interval")) {
      for (int i = 29; i < 31 ; i++) {
        dcmd1[i - 29] = (char)payload[i];
      }
      interval = atoi(dcmd1);
    }
  }
  Serial.println();
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("WemosClient", mqtt_user, mqtt_pwd)) {
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
  for ( i = 0; i < interval ; i++) {
    Analogvalue = analogRead(A0);
    Voltage = Voltage + Analogvalue;
    delay(1000);
    client.loop();
  }
  Serial.println(Voltage);
  Voltage = Voltage * 3 / 1023 * 2.714286 / interval;
  int a = (int(Voltage * 1000));
  Voltage = float(a) / 1000;
  count = millis();
  String temp = "Temp-";
  String hum = "Hum-";
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  String join1 = temp + t;
  String join2 = join1 + ",";
  String join3 = hum + h;
  String join = join2 + join3;

  client.loop();
  StaticJsonBuffer<300> JSONbuffer;
  JsonObject& JSONencoder = JSONbuffer.createObject();
  JSONencoder["device"] = "WemosD1";
  JSONencoder["user"] = "duy";
  JSONencoder["time"] = count;
  JSONencoder["voltage"] = Voltage;
  JSONencoder["prob"] = join;

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
  Serial.println("Interval");
  Serial.println(interval * 1000);
}
